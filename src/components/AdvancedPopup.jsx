import { React, useState } from "react";
import {v4 as generateUUID} from 'uuid';
import "../styles/advanced.css";
import "../styles/buttons.css";
import "../styles/grid.css";
import { update, ref } from "firebase/database";
import { db } from "../hooks/useFirebase";
import SavePresetModal from "./SavePresetModal.jsx";
import { savePreset, loadPreset, listPresets } from "../utils/presetUtils.js";


export default function AdvancedPopup({
                                          onClose,
                                          attackers,
                                          defenders,
                                          setAttackers,
                                          setDefenders,
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
                                          showFeedback,
                                          userUID
                                      }) {
    const [showPresetModal, setShowPresetModal] = useState(false);
    const [presets, setPresets] = useState(listPresets());

    function handleSaveAsPreset(name) {
        const cleanedAttackers = attackers.map(op => ({
            uid: op.uid,
            name: op.name,
            enabled: op.enabled
        }));
        const cleanedDefenders = defenders.map(op => ({
            uid: op.uid,
            name: op.name,
            enabled: op.enabled
        }));

        savePreset(name, { attackers: cleanedAttackers, defenders: cleanedDefenders });
        setPresets(listPresets());
        showFeedback?.(`Preset "${name}" saved!`);
    }

    function handleLoadPreset(name) {
        const preset = loadPreset(name);
        if (preset) {
            if (preset.attackers) {
                setAttackers(prev =>
                    prev.map(op => {
                        const match = preset.attackers.find(p => p.uid === op.uid);
                        return match ? { ...op, enabled: match.enabled } : op;
                    })
                );
            }

            if (preset.defenders) {
                setDefenders(prev =>
                    prev.map(op => {
                        const match = preset.defenders.find(p => p.uid === op.uid);
                        return match ? { ...op, enabled: match.enabled } : op;
                    })
                );
            }

            showFeedback?.(`Preset "${name}" loaded!`);
        }
    }

    // Generate a new team code (like before)
    const generateTeamCode = () => {
        const newCode = generateUUID().slice(0, 6);
        setPendingCode(newCode);
    };

    const handleJoinTeam = () => {
        if (pendingCode.trim()) {
            setTeamCode(pendingCode.trim());
            update(ref(db, `teams/${pendingCode.trim()}/${userUID}`), {
                name: userName.trim(),
                lastUpdated: Date.now(),
            }).catch((err) => console.error("Failed to save name on join:", err));

            showFeedback?.("Joined team!");
        } else if (userName.trim()) {
            setUserName(userName.trim());
            showFeedback?.("Name updated!");
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
                            handleSavePreset({ attackers, defenders, showFeedback });
                        }}
                    >
                        Save
                    </button>

                    <button onClick={() => setShowPresetModal(true)}>Save As Preset</button>

                    <button onClick={() => handleResetPreset()}>Reset</button>

                    <button
                        onClick={() => {
                            handleSaveWeights({ attackers, defenders, showFeedback });
                        }}
                    >
                        Save Weights
                    </button>

                    <button
                        onClick={() => {
                            handleDefaultPreset({ attackers, defenders, showFeedback });
                        }}
                    >
                        Default
                    </button>

                    <button onClick={() => setDupeToggle(!dupeToggle)}>
                        {dupeToggle ? "Disable Dupes" : "Enable Dupes"}
                    </button>

                    <select onChange={(e) => handleLoadPreset(e.target.value)}>
                        <option value="">-- Load Preset --</option>
                        {presets.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {feedback && <div className="feedback">{feedback}</div>}

            {/* Team Join */}
            <section>
                <h3>Team</h3>
                <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Unnamed"
                />
                <input
                    value={pendingCode}
                    onChange={(e) => setPendingCode(e.target.value)}
                    placeholder="75b27a"
                />
                <button onClick={handleJoinTeam}>Join</button>
                <button onClick={generateTeamCode}>Generate</button>
            </section>
            {showPresetModal && (
                <SavePresetModal
                    onSave={handleSaveAsPreset}
                    onClose={() => setShowPresetModal(false)}
                />
            )}
        </div>
    </div>);
}