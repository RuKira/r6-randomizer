import React from 'react';
import '../styles/chosen.css';

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export default function ChosenList({
                                       list,
                                       role,
                                       locked,
                                       rerolled,
                                       played,
                                       fadingReroll,
                                       removingAttackers,
                                       removingDefenders,
                                       rerollOperator,
                                       toggleLock,
                                       removeChosen
                                   }) {
    const sortedList = [...list].sort((a, b) => {
        const aPlayed = played.includes(a.uid);
        const bPlayed = played.includes(b.uid);
        if (aPlayed && !bPlayed) return 1;
        if (!aPlayed && bPlayed) return -1;
        return 0;
    });

    return (
        <div className="chosen-operators">
            {sortedList.map((op, idx) => (
                <div
                    key={op.uid || `${op.name}-${idx}`}
                    className={`chosen-icon
                        ${locked.includes(op.uid) ? 'locked' : ''}
                        ${rerolled.includes(op.uid) ? 'rerolled' : ''}
                        ${played.includes(op.uid) ? 'played fade-out' : ''}
                        ${(fadingReroll === op.uid ||
                        (role === 'attack' && removingAttackers.includes(op.uid)) ||
                        (role === 'defense' && removingDefenders.includes(op.uid)))
                        ? 'fade-out'
                        : ''}
                    `}
                >
                    <img src={op.image} alt={op.name} title={op.name} />
                    {!played.includes(op.uid) && (
                        <div className="chosen-buttons">
                            <button onClick={() => rerollOperator(op.uid, role)} title="Reroll">🔁</button>
                            <button onClick={() => toggleLock(op.uid, role)} title={locked.includes(op.uid) ? "Unlock" : "Lock"}>
                                {locked.includes(op.uid) ? "🔒" : "🔓"}
                            </button>
                            <button onClick={() => removeChosen(op.uid, role)} title="Played (Remove)">✅</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
