// components/TeammateDisplay.jsx
import React from 'react';
import '../styles/teammate.css';

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export default function TeammateView({ teamData, teammateNames, userUID }) {
    // Group operators by owner UID
    const grouped = {};
    for (const op of teamData) {
        if (!grouped[op.owner]) grouped[op.owner] = [];
        grouped[op.owner].push(op);
    }

    // Limit to 4 teammates max
    const teammateUIDs = Object.keys(grouped).filter(uid => uid !== userUID).slice(0, 4);

    return (
        <div className="teammates-row">
            {teammateUIDs.map((uid, index) => (
                <div key={uid}>
                    {index !== 0 && <div className="teammate-divider" />}

                    <div className="teammate-name">
                        <div className="teammate-display-name">
                            {teammateNames[uid] || "Unnamed"}
                        </div>
                    </div>

                    <div className="teammate-group">
                        {grouped[uid].map((op, idx) => (
                            <div
                                key={idx}
                                className={`teammate-icon-wrapper ${op.locked ? 'locked' : ''} ${op.rerolled ? 'rerolled' : ''} ${op.played ? 'played' : ''}`}
                                title={op.name}
                            >
                                <img
                                    src={`images/operators/${op.name.toLowerCase().replace(/[^a-z0-9]/gi, '')}.png`}
                                    alt={op.name}
                                    className="teammate-icon"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}