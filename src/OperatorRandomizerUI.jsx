// NPM package imports
import pkg from '../package.json';
import { useEffect, useRef, useState } from 'react';
import { ref, update } from "firebase/database";
import { v4 as generateUUID } from 'uuid';
// Local Constants Imports
import { attackerNames, defenderNames } from "./constants/operatorNames.js";
// Local Component Imports
import TeammateView from './components/TeammateDisplay';
import ChosenOperators from './components/ChosenOperators';
import OperatorGrid from "./components/OperatorGrid.jsx";
// Local Hook Imports
import { useTeamSync } from "./hooks/useTeamSync.js";
import { useLayoutScale } from "./hooks/useLayoutScale.js";
import { db } from './hooks/useFirebase.js';
import { useOperatorsState } from "./hooks/useOperatorsState.js";
import { useTeamCode } from "./hooks/useTeamCode.js";
import { useFeedback } from "./hooks/useFeedback.js";
// Local Utility Imports
import { rollOperatorsForRole, rerollOperator } from "./utils/rollUtils.js";
import { buildOps, loadDisabledOperators, toggleOperator as baseToggleOperator } from "./utils/operatorUtils.js";
import { refreshOps } from "./utils/resetUtils.js";
import { toggleLock } from "./utils/lockUtils.js";
import { removeChosen, handleSaveWeights, handleSavePreset, handleDefaultPreset } from "./utils/presetUtils.js";
// Local Style Imports
import './styles/buttons.css';
import './App.css';
import { analyzeTeamComposition } from "./utils/teamHealthUtils.js";

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
    const [weightChanges, setWeightChanges] = useState({});
    const [teamData, setTeamData] = useState({ attackers: [], defenders: [] });
    const [teammateNames, setTeammateNames] = useState({});
    const [removingAttackers, setRemovingAttackers] = useState([]);
    const [removingDefenders, setRemovingDefenders] = useState([]);
    const [healthCheck, setHealthCheck] = useState({ attackers: [], defenders: [] });
    const [swappableAttack, setSwappableAttack] = useState(null);
    const [swappableDefense, setSwappableDefense] = useState(null);


    // Variables
    const layoutRef = useRef < HTMLDivElement > null;
    useLayoutScale(layoutRef);

    const STORAGE_KEY = "r6-randomizer-preset";

    const APP_VERSION = `v${pkg.version}`;

    const {
        attackers, setAttackers,
        defenders, setDefenders,
        reloadOperatorsFromPreset
    } = useOperatorsState(STORAGE_KEY, attackerNames, defenderNames);


    const { teamCode, setTeamCode, myName, setMyName, userUID } = useTeamCode();

    const { feedback, showFeedback } = useFeedback();

    const { syncTeamState: syncAttack } = useTeamSync({
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

    const { syncTeamState: syncDefense } = useTeamSync({
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
        update(ref(db, path), { lastUpdated: Date.now() })
            .catch((err) => console.error("Firebase update failed:", err));
        const interval = setInterval(() => {
            update(ref(db, path), { lastUpdated: Date.now() })
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

        setHealthCheck({ attackers: attackAlerts, defenders: defenseAlerts });
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
            setWeightChanges,
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
            setWeightChanges,
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
            setWeightChanges,
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
            rerollHandler: handleRerollOperator,
            playedList: isAttack ? playedAttackers : playedDefenders,
            allowDupes
        });
    };

    const resetAll = () => {
        const resetWeights = list => list.map(op => ({ ...op, weight: 5 }));

        setAttackers(prev => resetWeights(prev));
        setDefenders(prev => resetWeights(prev));

        handleReset();
    };
    return (
        <div className="viewport-scaler">
            <div className="grid-layout centered fullscreen">
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
                        toggleLock={(uid, role) =>
                            toggleLock({
                                uid,
                                role,
                                lockedAttackers,
                                lockedDefenders,
                                setLockedAttackers,
                                setLockedDefenders,
                                syncAttack,
                                syncDefense
                            })
                        }
                        removeChosen={(uid, role) =>
                            removeChosen({
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
                            })
                        }
                        swappableUid={swappableAttack}
                        onPickForSwap={(uid) => setSwappableAttack(prev => prev === uid ? null : uid)}
                    />
                </div>
                <div className="operators-grid">
                    <h2>Attackers</h2>
                    <OperatorGrid
                        list={attackers}
                        role="attack"
                        toggleOperator={toggleOperator}
                        weightChanges={weightChanges}
                    />
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
                <div className="buttons-area">
                    <div className="version-label">
                        {APP_VERSION}
                    </div>
                    <div className="team-link-ui">
                        <input
                            title="Enter a team code to share your operator choices with others."
                            type="text"
                            placeholder="Enter team code..."
                            value={teamCode}
                            onChange={(e) => setTeamCode(e.target.value)}
                            style={{ padding: "6px", width: "160px" }}
                        />
                    </div>
                    <div>
                        <input
                            title="Enter your name to identify yourself in the team."
                            type="text"
                            placeholder="Your name..."
                            value={myName}
                            onChange={(e) => setMyName(e.target.value)}
                            style={{ padding: "6px", width: "160px", marginBottom: "6px" }}
                        />
                    </div>
                    <div className="team-code-input">
                        <button
                            title="Join a team with a code to share operator choices."
                            onClick={() => {
                                localStorage.setItem("team-code", teamCode);
                                update(ref(db, `teams/${teamCode}/${userUID}`), { name: myName })
                                    .catch((err) => console.error("Firebase update failed:", err));
                                localStorage.setItem("team-username", myName);
                                window.location.reload();
                            }}
                            style={{ marginLeft: "6px" }}
                        >
                            Join
                        </button>
                        <button
                            title="Generate a new team code to share with others."
                            onClick={() => {
                                const newCode = generateUUID().slice(0, 6);
                                setTeamCode(newCode);
                                update(ref(db, `teams/${teamCode}/${userUID}`), { name: myName })
                                    .catch((err) => console.error("Firebase update failed:", err));
                                localStorage.setItem("team-username", myName);
                                localStorage.setItem("team-code", newCode);
                            }}
                            style={{ marginLeft: "6px" }}
                        >
                            Generate
                        </button>
                    </div>
                    <div className="spin-controls">
                        <button
                            onClick={handleRollBoth}
                            title="Spin 6 random operators for both sides (Attack & Defense)"
                        >
                            SPIN OPERATORS
                        </button>

                        <label
                            className="allow-dupes-toggle"
                            title="Toggle whether duplicate operators can appear in the same roll."
                            style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={allowDupes}
                                onChange={(e) => setAllowDupes(e.target.checked)}
                            />
                            Allow Dupes
                        </label>
                    </div>
                    <button
                        onClick={resetAll}
                        title="Reset all weights and rerolls, but keep your saved preset (use this to freshen things up)"
                    >
                        RESET ALL
                    </button>

                    <button onClick={() =>
                        handleSavePreset({
                            attackers,
                            defenders,
                            showFeedback
                        })
                    }
                        title="Save your enabled/disabled operator selection. Click operators in the grid to disable them."
                    >
                        SAVE SELECTION
                    </button>

                    <button onClick={() =>
                        handleSaveWeights({
                            attackers,
                            defenders,
                            showFeedback
                        })
                    }
                        title="Save the current operator weights based on usage. You'll see weights adjust as you spin."
                    >
                        SAVE WEIGHTS
                    </button>

                    <button onClick={() =>
                        handleDefaultPreset({
                            attackers,
                            defenders,
                            setAttackers,
                            setDefenders,
                            showFeedback,
                            refreshOps: handleReset // OR pass refreshOps directly if preferred
                        })
                    }
                        title="Reset everything to default: re-enables all operators, resets weights, and overwrites your current save."
                    >
                        DEFAULT SELECTION
                    </button>
                    {feedback && <div className="feedback">{feedback}</div>}
                </div>
                <div className="operators-grid">
                    <h2>Defenders</h2>
                    <OperatorGrid
                        list={defenders}
                        role="defense"
                        toggleOperator={toggleOperator}
                        weightChanges={weightChanges}
                    />
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
                        toggleLock={(uid, role) =>
                            toggleLock({
                                uid,
                                role,
                                lockedAttackers,
                                lockedDefenders,
                                setLockedAttackers,
                                setLockedDefenders,
                                syncAttack,
                                syncDefense
                            })
                        }
                        removeChosen={(uid, role) =>
                            removeChosen({
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
                            })
                        }
                        swappableUid={swappableDefense}
                        onPickForSwap={(uid) => setSwappableDefense(prev => prev === uid ? null : uid)}
                    />
                </div>
            </div>
        </div>
    );
}

export default OperatorRandomizerUI;