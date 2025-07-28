// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export const toggleLock = ({ uid, role, lockedAttackers, lockedDefenders, setLockedAttackers, setLockedDefenders, syncAttack, syncDefense }) => {
    const locked = role === 'attack' ? lockedAttackers : lockedDefenders;
    const setLocked = role === 'attack' ? setLockedAttackers : setLockedDefenders;

    if (locked.includes(uid)) {
        setLocked(locked.filter(id => id !== uid));
    } else {
        setLocked([...locked, uid]);
    }

    if (role === 'attack') syncAttack();
    else syncDefense();
};

