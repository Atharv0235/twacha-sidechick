import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api/client';
import { prepareImage, makeThumbnail } from '../api/image';
import { CADENCES, DEFAULT_CADENCE, buildJourney, localDateKey } from '../ScanTimeline';
import { buildNotifications } from '../notifications';

const USER_KEY = 'twacha.user';
const KEEP_KEY = 'twacha.keepThumbnails';
// Things that stay on the phone are stored per account, so two people sharing a phone never see each other's.
const userKey = (id, name) => `twacha.u${id}.${name}`;

function read(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function write(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable or full */ }
}
function remove(key) {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

const Ctx = createContext(null);
export const useAppData = () => useContext(Ctx);

export function AppDataProvider({ children }) {
  // user: { id, email, name, city } or null when logged out. Cached so the app opens instantly, then re-checked with the server.
  const [user, setUser] = useState(() => (api.getToken() ? read(USER_KEY, null) : null));
  const [keepThumbnails, setKeepThumbnails] = useState(() => read(KEEP_KEY, true));
  const [sessionMessage, setSessionMessage] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);        // changes on every login, so screens can start fresh
  const initialId = user?.id;
  const [lastScan, setLastScan] = useState(() => (initialId ? read(userKey(initialId, 'lastScan'), null) : null));
  const [thumbs, setThumbs] = useState(() => (initialId ? read(userKey(initialId, 'thumbs'), {}) : {}));
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [foodLog, setFoodLog] = useState([]);
  const [foodNames, setFoodNames] = useState([]);
  const [plan, setPlan] = useState(null);       // PlanSummary from the server, or null until loaded
  const [planError, setPlanError] = useState(null);
  const [week, setWeek] = useState(null);     // WeekSummary from the server, or null until loaded
  // Kept on the phone, per account: how often to suggest a scan (3 or 4 days) and which in-app reminders were already read.
  const [cadence, setCadenceState] = useState(() => (initialId ? read(userKey(initialId, 'cadence'), DEFAULT_CADENCE) : DEFAULT_CADENCE));
  const [readNotes, setReadNotes] = useState(() => (initialId ? read(userKey(initialId, 'notesRead'), []) : []));

  const uid = user?.id;

  const resetData = useCallback(() => {
    setLastScan(null); setThumbs({}); setHistory(null); setHistoryError(null);
    setFoodLog([]); setPlan(null); setPlanError(null); setWeek(null);
    setCadenceState(DEFAULT_CADENCE); setReadNotes([]);
  }, []);

  const enterSession = useCallback((auth) => {
    api.setToken(auth.access_token);
    write(USER_KEY, auth.user);
    resetData();
    setLastScan(read(userKey(auth.user.id, 'lastScan'), null));
    setThumbs(read(userKey(auth.user.id, 'thumbs'), {}));
    setCadenceState(read(userKey(auth.user.id, 'cadence'), DEFAULT_CADENCE));
    setReadNotes(read(userKey(auth.user.id, 'notesRead'), []));
    setSessionMessage(null);
    setSessionKey((k) => k + 1);
    setUser(auth.user);
  }, [resetData]);

  const leaveSession = useCallback((message) => {
    api.clearToken();
    remove(USER_KEY);
    resetData();
    setSessionMessage(typeof message === 'string' ? message : null);
    setUser(null);
  }, [resetData]);

  // The server says the login is no longer valid (expired, password changed on another device, account deleted).
  useEffect(() => {
    api.setUnauthorizedHandler(() => leaveSession('Your session ended. Please log in again.'));
    return () => api.setUnauthorizedHandler(null);
  }, [leaveSession]);

  // Re-check the saved login once when the app opens. A network error keeps the cached user so the app still opens offline.
  useEffect(() => {
    if (!api.getToken()) return;
    api.getMe().then((u) => { write(USER_KEY, u); setUser(u); }).catch(() => { /* handler logs out on 401 */ });
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await api.getHistory(60));
      setHistoryError(null);
    } catch (e) {
      if (e.kind !== 'auth') setHistoryError(e.message);
    }
  }, []);

  const refreshLog = useCallback(async () => {
    try { setFoodLog(await api.getLog(7)); } catch { /* shown as empty */ }
  }, []);

  const refreshPlan = useCallback(async () => {
    try {
      setPlan(await api.getPlan());
      setPlanError(null);
    } catch (e) {
      if (e.kind !== 'auth') setPlanError(e.message);
    }
  }, []);

  const refreshWeek = useCallback(async () => {
    try { setWeek(await api.getWeek()); } catch { /* the card simply stays hidden */ }
  }, []);

  const loadFoodNames = useCallback(async () => {
    try { setFoodNames(await api.getFoods()); } catch { /* picker stays empty */ }
  }, []);

  useEffect(() => {
    if (uid) {
      refreshHistory();
      refreshLog();
      refreshPlan();
      refreshWeek();
      loadFoodNames();
    }
  }, [uid, refreshHistory, refreshLog, refreshPlan, refreshWeek, loadFoodNames]);

  // ── Account actions ──
  const signUp = useCallback(async ({ email, password, name, city, keep }) => {
    const auth = await api.register({ email, password, name, city: city || null, accepted_terms: true });
    setKeepThumbnails(keep);
    write(KEEP_KEY, keep);
    enterSession(auth);
  }, [enterSession]);

  const logIn = useCallback(async (email, password) => {
    enterSession(await api.login(email, password));
  }, [enterSession]);

  const logOut = useCallback(() => leaveSession(), [leaveSession]);

  const updateProfile = useCallback(async ({ name, city }) => {
    const u = await api.updateMe(name, city);
    write(USER_KEY, u);
    setUser(u);
  }, []);

  const changePassword = useCallback(async (current, next) => {
    const auth = await api.changePassword(current, next);
    api.setToken(auth.access_token);       // the old token (and every other device's) no longer works
  }, []);

  const clearLocalFor = useCallback((id) => {
    if (id) ['lastScan', 'thumbs', 'cadence', 'notesRead'].forEach((n) => remove(userKey(id, n)));
  }, []);

  /** Deletes the account and everything stored for it, on the server and on this phone. */
  const deleteAccount = useCallback(async (password) => {
    const id = uid;
    await api.deleteAccount(password);
    clearLocalFor(id);
    leaveSession();
  }, [uid, clearLocalFor, leaveSession]);

  /** Deletes scans, food log and plan for this account but keeps the account. */
  const deleteMyData = useCallback(async () => {
    await api.deleteMyData();
    clearLocalFor(uid);
    resetData();
    refreshHistory(); refreshLog(); refreshPlan(); refreshWeek();
  }, [uid, clearLocalFor, resetData, refreshHistory, refreshLog, refreshPlan, refreshWeek]);

  // ── Scan and food log ──
  /** Runs a scan on a photo Blob. Throws ApiError / Error with a readable message. */
  const runScan = useCallback(async (rawBlob) => {
    const prepared = await prepareImage(rawBlob);
    const result = await api.scan(prepared, user?.city || undefined);
    setLastScan(result);
    write(userKey(uid, 'lastScan'), result);
    if (keepThumbnails !== false) {
      try {
        const t = await makeThumbnail(prepared);
        setThumbs((prev) => {
          const next = { ...prev, [result.scan.id]: t };
          write(userKey(uid, 'thumbs'), next);
          return next;
        });
      } catch { /* thumbnail is optional */ }
    }
    refreshHistory();
    refreshPlan();
    refreshWeek();
    return result;
  }, [user?.city, uid, keepThumbnails, refreshHistory, refreshPlan, refreshWeek]);

  const saveFoods = useCallback(async (foods) => {
    const saved = await api.saveLog(foods);
    await Promise.all([refreshLog(), refreshPlan(), refreshWeek()]);
    return saved;
  }, [refreshLog, refreshPlan, refreshWeek]);

  const clearThumbs = useCallback(() => { setThumbs({}); remove(userKey(uid, 'thumbs')); }, [uid]);

  // ── Plan ──
  const addToPlan = useCallback(async (food, kind) => {
    await api.addPlanItem(food, kind);
    await Promise.all([refreshPlan(), refreshWeek()]);
  }, [refreshPlan, refreshWeek]);
  const removeFromPlan = useCallback(async (id) => { await api.removePlanItem(id); await Promise.all([refreshPlan(), refreshWeek()]); }, [refreshPlan, refreshWeek]);
  const setPlanTarget = useCallback(async (id, days) => { await api.setPlanTarget(id, days); await Promise.all([refreshPlan(), refreshWeek()]); }, [refreshPlan, refreshWeek]);
  const tickFood = useCallback(async (food, done) => {
    await api.checkPlanFood(food, done);
    await Promise.all([refreshPlan(), refreshLog(), refreshWeek()]);
  }, [refreshPlan, refreshLog, refreshWeek]);

  // The phone's calendar date, re-checked every minute so the journey and reminders roll over at midnight without a reload.
  const [todayKey, setTodayKey] = useState(() => localDateKey(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTodayKey((k) => { const n = localDateKey(new Date()); return n === k ? k : n; }), 60000);
    return () => clearInterval(id);
  }, []);
  const journey = useMemo(
    () => buildJourney({ scans: history?.scans || [], program: history?.program || null, cadence, now: new Date() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, cadence, todayKey]
  );

  const setCadence = useCallback((days) => {
    if (!CADENCES.includes(days)) return;
    setCadenceState(days);
    write(userKey(uid, 'cadence'), days);
  }, [uid]);

  // In-app reminders (the bell). Worked out here from data already loaded; nothing is sent anywhere.
  const notifications = useMemo(
    () => (uid ? buildNotifications({ history, plan, week, cadence, now: new Date() }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, history, plan, week, cadence, todayKey]
  );
  const unreadNotes = useMemo(() => {
    const seen = new Set(readNotes);
    return notifications.filter((n) => !seen.has(n.id)).length;
  }, [notifications, readNotes]);
  const markNotesRead = useCallback(() => {
    setReadNotes((prev) => {
      const next = [...new Set([...prev, ...notifications.map((n) => n.id)])].slice(-80);
      write(userKey(uid, 'notesRead'), next);
      return next;
    });
  }, [notifications, uid]);

  // Components read a simple "profile": the account's name and city plus the on-phone preference.
  const profile = useMemo(
    () => (user ? { name: user.name, city: user.city || '', email: user.email, keepThumbnails } : null),
    [user, keepThumbnails]
  );

  const value = useMemo(() => ({
    user, profile, sessionMessage, sessionKey, lastScan, thumbs, history, historyError, foodLog, foodNames, plan, planError, week,
    cadence, setCadence, journey, notifications, unreadNotes, markNotesRead, readNotes,
    signUp, logIn, logOut, updateProfile, changePassword, deleteAccount, deleteMyData,
    runScan, saveFoods, refreshHistory, refreshPlan, refreshWeek, clearThumbs,
    addToPlan, removeFromPlan, setPlanTarget, tickFood
  }), [user, profile, sessionMessage, sessionKey, lastScan, thumbs, history, historyError, foodLog, foodNames, plan, planError, week,
    cadence, setCadence, journey, notifications, unreadNotes, markNotesRead, readNotes,
    signUp, logIn, logOut, updateProfile, changePassword, deleteAccount, deleteMyData,
    runScan, saveFoods, refreshHistory, refreshPlan, refreshWeek, clearThumbs,
    addToPlan, removeFromPlan, setPlanTarget, tickFood]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
