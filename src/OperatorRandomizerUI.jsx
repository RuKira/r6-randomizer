// NPM package imports
import pkg from '../package.json';
import {useEffect, useRef, useState} from 'react';
import {ref, update} from "firebase/database";
// Local Constants Imports
import {attackerNames, defenderNames} from "./constants/operatorNames.js";
// Local Component Imports
import TeammateView from './components/TeammateDisplay';
import ChosenOperators from './components/ChosenOperators';
import AdvancedPopup from "./components/AdvancedPopup.jsx";
// Local Hook Imports
import {useTeamSync} from "./hooks/useTeamSync.js";
import {useLayoutScale} from "./hooks/useLayoutScale.js";
import {db} from './hooks/useFirebase.js';
import {useOperatorsState} from "./hooks/useOperatorsState.js";
import {useTeamCode} from "./hooks/useTeamCode.js";
import {useFeedback} from "./hooks/useFeedback.js";
// Local Utility Imports
import {rerollOperator, rollOperatorsForRole} from "./utils/rollUtils.js";
import {buildOps, loadDisabledOperators, toggleOperator as baseToggleOperator} from "./utils/operatorUtils.js";
import {refreshOps} from "./utils/resetUtils.js";
import {toggleLock} from "./utils/lockUtils.js";
import {handleDefaultPreset, handleSavePreset, handleSaveWeights, removeChosen} from "./utils/presetUtils.js";
import {analyzeTeamComposition} from "./utils/teamHealthUtils.js";
// Local Style Imports
import './styles/buttons.css';
import './App.css';

function OperatorRandomizerUI() {

    // States
    const [chosenAttackers, setChosenAttackers] = useState([]);
    const [chosenDefenders, setChosenDefenders] = useState([]);
    const [lockedAttackers, setLockedAttackers] = useState([]);
    const [lockedDefenders, setLockedDefenders] = useState([]);
    const [rerolledAttackers, setRerolledAttackers] = useState([]);
    const [rerolledDefenders, setRerolledDefenders] = useState([]);
    const [playedAttackers, setPlayedAttackers] = useState([]);
    const [playedDefenders, setPlayedDefenders] = useState([]);
    const [fadingReroll, _setFadingReroll] = useState(null);
    const [allowDupes, setAllowDupes] = useState(true);
    const [teamData, setTeamData] = useState({attackers: [], defenders: []});
    const [teammateNames, setTeammateNames] = useState({});
    const [removingAttackers, setRemovingAttackers] = useState([]);
    const [removingDefenders, setRemovingDefenders] = useState([]);
    const [healthCheck, setHealthCheck] = useState({attackers: [], defenders: []});
    const [swappableAttack, setSwappableAttack] = useState(null);
    const [swappableDefense, setSwappableDefense] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);


    // Variables
    const layoutRef = useRef < HTMLDivElement > null;
    useLayoutScale(layoutRef);

    const STORAGE_KEY = "r6-randomizer-preset";

    const APP_VERSION = `v${pkg.version}`;

    const {
        attackers, setAttackers, defenders, setDefenders, _reloadOperatorsFromPreset
    } = useOperatorsState(STORAGE_KEY, attackerNames, defenderNames);

    const {teamCode, setTeamCode, myName, setMyName, userUID} = useTeamCode();

    const [pendingCode, setPendingCode] = useState(teamCode || "");

    const {feedback, showFeedback} = useFeedback();

    const {syncTeamState: syncAttack} = useTeamSync({
        teamCode,
        userUID,
        role: 'attack',
        chosen: chosenAttackers,
        locked: lockedAttackers,
        played: playedAttackers,
        rerolled: rerolledAttackers,
        swappableAttack,
        swappableDefense: null,
        setTeammateNames,
        setTeamData,
        setSwappableAttack,
        setSwappableDefense,
        setChosenAttackers,
        setLockedAttackers,
        setRerolledAttackers,
        setPlayedAttackers,
    });

    const {syncTeamState: syncDefense} = useTeamSync({
        teamCode,
        userUID,
        role: 'defense',
        chosen: chosenDefenders,
        locked: lockedDefenders,
        played: playedDefenders,
        rerolled: rerolledDefenders,
        swappableAttack: null,
        swappableDefense,
        setTeammateNames,
        setTeamData,
        setSwappableAttack,
        setSwappableDefense,
        setChosenDefenders,
        setLockedDefenders,
        setRerolledDefenders,
        setPlayedDefenders,
    });


    // Effects
    useEffect(() => {
        if (teamCode) syncAttack();
    }, [chosenAttackers, lockedAttackers, playedAttackers, rerolledAttackers, syncAttack, teamCode, swappableAttack]);

    useEffect(() => {
        if (teamCode) syncDefense();
    }, [chosenDefenders, lockedDefenders, playedDefenders, rerolledDefenders, syncDefense, teamCode, swappableDefense]);

    useEffect(() => {
        if (!teamCode) return;

        const path = `teams/${teamCode}/${userUID}`;
        update(ref(db, path), {lastUpdated: Date.now()})
            .catch((err) => console.error("Firebase update failed:", err));
        const interval = setInterval(() => {
            update(ref(db, path), {lastUpdated: Date.now()})
                .catch((err) => console.error("Firebase update failed:", err));
        }, 60000); // refresh every minute

        return () => clearInterval(interval);
    }, [teamCode, userUID]);

    useEffect(() => {
        const baseHeight = 1080;

        const scaleLayout = () => {
            const height = window.innerHeight;
            const scale = Math.min(height / baseHeight, 1);
            if (layoutRef.current) {
                layoutRef.current.style.transform = `scale(${scale})`;
            }
        };

        scaleLayout();
        window.addEventListener('resize', scaleLayout);

        const baseAttackers = buildOps(attackerNames, 'attack');
        const baseDefenders = buildOps(defenderNames, 'defense');

        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) {
            setAttackers(loadDisabledOperators(baseAttackers, 'attack', saved));
            setDefenders(loadDisabledOperators(baseDefenders, 'defense', saved));
        } else {
            setAttackers(baseAttackers);
            setDefenders(baseDefenders);
        }

        return () => window.removeEventListener('resize', scaleLayout);
    }, [layoutRef, setAttackers, setDefenders]);

    useEffect(() => {
        const fullAttackTeam = [...chosenAttackers, ...(teamData.attackers || [])];
        const fullDefenseTeam = [...chosenDefenders, ...(teamData.defenders || [])];

        const attackAlerts = analyzeTeamComposition(fullAttackTeam, "attack");
        const defenseAlerts = analyzeTeamComposition(fullDefenseTeam, "defense");

        setHealthCheck({attackers: attackAlerts, defenders: defenseAlerts});
    }, [chosenAttackers, chosenDefenders, teamData]);

    // Functions
    const handleReset = () => {
        refreshOps({
            setChosenAttackers,
            setChosenDefenders,
            setLockedAttackers,
            setLockedDefenders,
            setRerolledAttackers,
            setRerolledDefenders,
            setPlayedAttackers,
            setPlayedDefenders,
        });
    };

    const handleRollBoth = () => {
        handleReset();

        rollOperatorsForRole({
            role: 'attack',
            list: attackers,
            chosen: chosenAttackers,
            locked: lockedAttackers,
            setList: setAttackers,
            setChosen: setChosenAttackers,
            setLocked: setLockedAttackers,
            setRerolled: setRerolledAttackers,
            setPlayed: setPlayedAttackers,
            allowDupes,
            sync: syncAttack,
            setHealthCheck
        });

        rollOperatorsForRole({
            role: 'defense',
            list: defenders,
            chosen: chosenDefenders,
            locked: lockedDefenders,
            setList: setDefenders,
            setChosen: setChosenDefenders,
            setLocked: setLockedDefenders,
            setRerolled: setRerolledDefenders,
            setPlayed: setPlayedDefenders,
            allowDupes,
            sync: syncDefense,
            setHealthCheck
        });
    };

    const handleRerollOperator = (uid, role) => {
        const isAttack = role === 'attack';
        rerollOperator({
            uid,
            chosen: isAttack ? chosenAttackers : chosenDefenders,
            setChosen: isAttack ? setChosenAttackers : setChosenDefenders,
            list: isAttack ? attackers : defenders,
            setList: isAttack ? setAttackers : setDefenders,
            allowDupes,
            setRerolled: isAttack ? setRerolledAttackers : setRerolledDefenders,
            played: isAttack ? playedAttackers : playedDefenders
        });
    };

    const toggleOperator = (uid, role) => {
        const isAttack = role === 'attack';

        baseToggleOperator({
            uid,
            role,
            list: isAttack ? attackers : defenders,
            setList: isAttack ? setAttackers : setDefenders,
            chosenList: isAttack ? chosenAttackers : chosenDefenders,
            setChosen: isAttack ? setChosenAttackers : setChosenDefenders,
            setRerolled: isAttack ? setRerolledAttackers : setRerolledDefenders,
            playedList: isAttack ? playedAttackers : playedDefenders,
            allowDupes
        });
    };

    const resetAll = () => {
        const resetWeights = list => list.map(op => ({...op, weight: 5}));

        setAttackers(prev => resetWeights(prev));
        setDefenders(prev => resetWeights(prev));

        handleReset();
    };
    return (<div className="viewport-scaler">
        <div className="grid-layout centered fullscreen">
            <div>
                <button onClick={() => setShowAdvanced(true)} className="gear-btn">⚙️</button>

                {showAdvanced && (<AdvancedPopup
                    onClose={() => setShowAdvanced(false)}
                    attackers={attackers}
                    defenders={defenders}
                    toggleOperator={toggleOperator}
                    handleSavePreset={handleSavePreset}
                    handleResetPreset={resetAll}
                    handleDefaultPreset={handleDefaultPreset}
                    handleSaveWeights={handleSaveWeights}
                    dupeToggle={allowDupes}
                    setDupeToggle={setAllowDupes}
                    pendingCode={pendingCode}
                    setPendingCode={setPendingCode}
                    teamCode={teamCode}
                    setTeamCode={setTeamCode}
                    userName={myName}
                    setUserName={setMyName}
                    feedback={feedback}
                    showFeedback={showFeedback}
                />)}
            </div>
            <div className="chosen-list chosen-left">
                <ChosenOperators
                    list={chosenAttackers}
                    role="attack"
                    locked={lockedAttackers}
                    rerolled={rerolledAttackers}
                    played={playedAttackers}
                    fadingReroll={fadingReroll}
                    removingAttackers={removingAttackers}
                    removingDefenders={removingDefenders}
                    rerollOperator={handleRerollOperator}
                    toggleLock={(uid, role) => toggleLock({
                        uid,
                        role,
                        lockedAttackers,
                        lockedDefenders,
                        setLockedAttackers,
                        setLockedDefenders,
                        syncAttack,
                        syncDefense
                    })}
                    removeChosen={(uid, role) => removeChosen({
                        uid,
                        role,
                        teamCode,
                        teamData,
                        setPlayedAttackers,
                        setPlayedDefenders,
                        setRemovingAttackers,
                        setRemovingDefenders,
                        setChosenAttackers,
                        setChosenDefenders,
                        setLockedAttackers,
                        setLockedDefenders,
                        syncAttack,
                        syncDefense
                    })}
                    toggleOperator={toggleOperator}
                    swappableUid={swappableAttack}
                    onPickForSwap={(uid) => setSwappableAttack(prev => prev === uid ? null : uid)}
                />
            </div>
            <div className="operators-grid">
                <h2>Attackers</h2>
                <div className="team-health-bar">
                    <div>
                        <ul>{healthCheck.attackers.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
                    </div>
                </div>
                <div>
                    <TeammateView
                        teamData={teamData.attackers}
                        teammateNames={teammateNames}
                        userUID={userUID}
                    />
                </div>
            </div>
            <div className="spin-controls">
                <button
                    className="styled-button"
                    onClick={handleRollBoth}
                    title="Spin 6 random operators for both sides (Attack & Defense)"
                >
                    SPIN OPERATORS
                </button>
            </div>
            <div className="operators-grid">
                <h2>Defenders</h2>
                <div className="team-health-bar">
                    <div>
                        <ul>{healthCheck.defenders.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
                    </div>
                </div>
                <div>
                    <TeammateView
                        teamData={teamData.defenders}
                        teammateNames={teammateNames}
                        userUID={userUID}
                    />
                </div>
            </div>
            <div className="chosen-list chosen-right">
                <ChosenOperators
                    list={chosenDefenders}
                    role="defense"
                    locked={lockedDefenders}
                    rerolled={rerolledDefenders}
                    played={playedDefenders}
                    fadingReroll={fadingReroll}
                    removingAttackers={removingAttackers}
                    removingDefenders={removingDefenders}
                    rerollOperator={handleRerollOperator}
                    toggleLock={(uid, role) => toggleLock({
                        uid,
                        role,
                        lockedAttackers,
                        lockedDefenders,
                        setLockedAttackers,
                        setLockedDefenders,
                        syncAttack,
                        syncDefense
                    })}
                    removeChosen={(uid, role) => removeChosen({
                        uid,
                        role,
                        teamCode,
                        teamData,
                        setPlayedAttackers,
                        setPlayedDefenders,
                        setRemovingAttackers,
                        setRemovingDefenders,
                        setChosenAttackers,
                        setChosenDefenders,
                        setLockedAttackers,
                        setLockedDefenders,
                        syncAttack,
                        syncDefense
                    })}
                    toggleOperator={toggleOperator}
                    swappableUid={swappableDefense}
                    onPickForSwap={(uid) => setSwappableDefense(prev => prev === uid ? null : uid)}
                />
            </div>
        </div>
    </div>);
}

export default OperatorRandomizerUI;