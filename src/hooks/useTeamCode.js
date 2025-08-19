import { useState } from "react";

export function useTeamCode() {
    const [teamCode, setTeamCode] = useState(localStorage.getItem("team-code") || "");
    const [myName, setMyName] = useState(localStorage.getItem("team-username") || "");
    const [userUID] = useState(() => {
        const stored = localStorage.getItem("team-user-uid");
        if (stored) return stored;
        const newUID = crypto.randomUUID();
        localStorage.setItem("team-user-uid", newUID);
        return newUID;
    });

    // this is just what user types before pressing Join
    const [pendingCode, setPendingCode] = useState(teamCode);

    const setAndStoreTeamCode = (code) => {
        setTeamCode(code);
        localStorage.setItem("team-code", code);
    };

    const setAndStoreMyName = (name) => {
        setMyName(name);
        localStorage.setItem("team-username", name);
    };

    return {
        teamCode,
        pendingCode,
        setPendingCode,
        myName,
        userUID,
        setTeamCode: setAndStoreTeamCode,
        setMyName: setAndStoreMyName
    };
}