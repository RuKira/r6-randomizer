import { saveDisabledOperators } from "./operatorUtils.js";
import { refreshOps } from "./resetUtils.js";

/**
 * Removes a chosen operator and marks it as played.
 */
export const removeChosen = ({
    uid,
    role,
    teamCode,
    teamData,
    setChosenAttackers,
    setChosenDefenders,
    setPlayedAttackers,
    setPlayedDefenders,
    setRemovingAttackers,
    setRemovingDefenders,
    setLockedAttackers,     // 👈 add
    setLockedDefenders,     // 👈 add
    syncAttack,
    syncDefense,
}) => {
    const isTeamView = teamCode && teamData;

    if (role === 'attack') {
        // 1) mark played
        setPlayedAttackers(prev => [...new Set([...prev, uid])]);
        // 2) clear any lock on this uid
        setLockedAttackers(prev => prev.filter(id => id !== uid));

        if (!isTeamView) {
            setRemovingAttackers(prev => [...new Set([...prev, uid])]);
            setTimeout(() => {
                setChosenAttackers(prev => prev.filter(op => op.uid !== uid));
                setRemovingAttackers(prev => prev.filter(id => id !== uid));
            }, 400);
        }

        syncAttack();
    } else {
        setPlayedDefenders(prev => [...new Set([...prev, uid])]);
        setLockedDefenders(prev => prev.filter(id => id !== uid)); // 👈 clear lock

        if (!isTeamView) {
            setRemovingDefenders(prev => [...new Set([...prev, uid])]);
            setTimeout(() => {
                setChosenDefenders(prev => prev.filter(op => op.uid !== uid));
                setRemovingDefenders(prev => prev.filter(id => id !== uid));
            }, 400);
        }

        syncDefense();
    }
};


/**
 * Saves the currently enabled/disabled operators.
 */
export const handleSavePreset = ({
    attackers,
    defenders,
    showFeedback,
}) => {
    saveDisabledOperators(attackers, defenders);
    showFeedback("Preset saved!");
};

/**
 * Resets all operators to enabled and clears weights, then saves as the default.
 */
export const handleDefaultPreset = ({
    attackers,
    defenders,
    setAttackers,
    setDefenders,
    showFeedback,
    setChosenAttackers,
    setChosenDefenders,
    setLockedAttackers,
    setLockedDefenders,
    setRerolledAttackers,
    setRerolledDefenders,
    setPlayedAttackers,
    setPlayedDefenders
}) => {
    const resetAttack = attackers.map(op => ({ ...op, enabled: true }));
    const resetDefense = defenders.map(op => ({ ...op, enabled: true }));

    setAttackers(resetAttack);
    setDefenders(resetDefense);
    saveDisabledOperators(resetAttack, resetDefense); // Save the new default state
    showFeedback("Default preset applied & saved!");

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

/**
 * Saves operator weights (e.g., for tracking roll frequency).
 */
export const handleSaveWeights = ({
    attackers,
    defenders,
    showFeedback,
}) => {
    saveDisabledOperators(attackers, defenders, true);
    showFeedback("Weights saved to preset!");
};
