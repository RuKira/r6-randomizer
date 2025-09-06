import React from "react";
import {v4 as generateUUID} from 'uuid';
import "../styles/advanced.css";
import "../styles/buttons.css";
import "../styles/grid.css";

export default function AdvancedPopup({
                                          onClose,
                                          attackers,
                                          defenders,
                                          toggleOperator,
                                          handleSavePreset,
                                          handleResetPreset,
                                          handleDefaultPreset,
                                          handleSaveWeights,
                                          dupeToggle,
                                          setDupeToggle,
                                          pendingCode,
                                          setPendingCode,
                                          setTeamCode,
                                          userName,
                                          setUserName,
                                          feedback,
                                          showFeedback
                                      }) {
    // Generate a new team code (like before)
    const generateTeamCode = () => {
        const newCode = generateUUID().slice(0, 6);
        setPendingCode(newCode);
    };

    const handleJoinTeam = () => {
        if (pendingCode) {
            setTeamCode(pendingCode);
        }
    };

    return (<div className="advanced-overlay" onClick={onClose}>
        <div className="advanced-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={onClose}>✖</button>
            <h2>Advanced Settings</h2>

            {/* Operator Grid */}
            <section>
                <h3>Operator Selection</h3>
                <div className="advanced-grid-container">
                    <div className="advanced-column">
                        <h4>Attackers</h4>
                        <div className="grid-operators">
                            {attackers.filter(op => op.name !== "Wildcard").map(op => (<div
                                key={op.uid}
                                className={`op-icon ${!op.enabled ? "disabled" : ""}`}
                                onClick={() => toggleOperator(op.uid, "attack")}
                                title={`${op.name} (Weight: ${op.weight})`}
                            >
                                <img
                                    src={`images/operators/${op.name.toLowerCase().replace(/[^a-z0-9]/gi, "")}.png`}
                                    alt={op.name}
                                />
                                <span className="op-weight">{op.weight}</span>
                            </div>))}
                        </div>
                    </div>
                    <div className="advanced-column">
                        <h4>Defenders</h4>
                        <div className="grid-operators">
                            {defenders.filter(op => op.name !== "Wildcard").map(op => (<div
                                key={op.uid}
                                className={`op-icon ${!op.enabled ? "disabled" : ""}`}
                                onClick={() => toggleOperator(op.uid, "defense")}
                                title={`${op.name} (Weight: ${op.weight})`}
                            >
                                <img
                                    src={`images/operators/${op.name.toLowerCase().replace(/[^a-z0-9]/gi, "")}.png`}
                                    alt={op.name}
                                />
                                <span className="op-weight">{op.weight}</span>
                            </div>))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Controls */}
            <section>
                <h3>Controls</h3>
                <div className="buttons-area">
                    <button
                        onClick={() => {
                            handleSavePreset({attackers, defenders, showFeedback});
                        }}
                    >
                        Save
                    </button>

                    <button
                        onClick={() => {
                            handleResetPreset();
                        }}
                    >
                        Reset
                    </button>

                    <button
                        onClick={() => {
                            handleSaveWeights({attackers, defenders, showFeedback});
                        }}
                    >
                        Save Weights
                    </button>

                    <button
                        onClick={() => {
                            handleDefaultPreset({attackers, defenders, showFeedback});
                        }}
                    >
                        Default
                    </button>
                    <button onClick={() => setDupeToggle(!dupeToggle)}>
                        {dupeToggle ? "Disable Dupes" : "Enable Dupes"}
                    </button>
                </div>
            </section>

            {feedback && <div className="feedback">{feedback}</div>}

            {/* Team Join */}
            <section>
                <h3>Team</h3>
                <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Name"
                />
                <input
                    value={pendingCode}
                    onChange={(e) => setPendingCode(e.target.value)}
                    placeholder="Team Code"
                />
                <button onClick={handleJoinTeam}>Join</button>
                <button onClick={generateTeamCode}>Generate</button>
            </section>
        </div>
    </div>);
}