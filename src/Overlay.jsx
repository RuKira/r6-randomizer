import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "./hooks/useFirebase";
import { ref, onValue, off } from "firebase/database";
import "./styles/overlay.css";

export default function Overlay() {
    const [searchParams] = useSearchParams();
    const teamCode = searchParams.get("teamCode");
    const uid = searchParams.get("uid");

    const [attackers, setAttackers] = useState([]);
    const [defenders, setDefenders] = useState([]);
    const [teamData, setTeamData] = useState({});

    const getImage = (op) =>
        op.image ||
        `images/operators/${op.name.toLowerCase().replace(/[^a-z0-9]/gi, "")}.png`;

    const getClasses = (op, side, player) => {
        let cls = "overlay-icon";
        const pdata = player?.[side];
        if (pdata?.locked?.includes(op.uid)) cls += " locked";
        if (pdata?.rerolled?.includes(op.uid)) cls += " rerolled";
        if (pdata?.played?.includes(op.uid)) cls += " played";
        if (side === "attack" && player?.swappableAttack === op.uid) cls += " swappable";
        if (side === "defense" && player?.swappableDefense === op.uid) cls += " swappable";
        return cls;
    };

    useEffect(() => {
        document.body.classList.add("overlay-mode");
        document.documentElement.classList.add("overlay-mode");
        return () => {
            document.body.classList.remove("overlay-mode");
            document.documentElement.classList.remove("overlay-mode");
        };
    }, []);

    useEffect(() => {
        if (!teamCode || !uid) return;
        const teamRef = ref(db, `teams/${teamCode}`);

        const unsub = onValue(teamRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            setTeamData(data);
            const me = data[uid];
            if (!me) return;

            setAttackers(me.attack?.chosen || []);
            setDefenders(me.defense?.chosen || []);
        });

        return () => off(teamRef, "value", unsub);
    }, [teamCode, uid]);

    return (
        <div className="overlay-container">
            {/* Left column = your attackers */}
            <div className="overlay-column overlay-left">
                {attackers.map((op) => (
                    <img
                        key={op.uid}
                        className={getClasses(op, "attack", teamData[uid])}
                        src={getImage(op)}
                        alt={op.name}
                        title={op.name}
                    />
                ))}
            </div>

            {/* Right column = your defenders */}
            <div className="overlay-column overlay-right">
                {defenders.map((op) => (
                    <img
                        key={op.uid}
                        className={getClasses(op, "defense", teamData[uid])}
                        src={getImage(op)}
                        alt={op.name}
                        title={op.name}
                    />
                ))}
            </div>
            {/* Bottom = teamview split into attack/defense */}
            <div className="overlay-teamview overlay-teamview-left">
                {Object.entries(teamData)
                    .filter(([tid]) => tid !== uid)
                    .filter(([_, player]) => (player.attack?.chosen?.length ?? 0) > 0)
                    .map(([tid, player]) => (
                        <div key={tid} className="overlay-teammate">
                            <div className="overlay-teammate-name">{player.name || tid}</div>
                            <div className="overlay-teammate-ops">
                                {(player.attack?.chosen || []).map((op) => (
                                    <img
                                        key={op.uid}
                                        className={`overlay-icon
                                        ${player.attack?.locked?.includes(op.uid) ? "locked" : ""}
                                        ${player.attack?.rerolled?.includes(op.uid) ? "rerolled" : ""}
                                        ${player.attack?.played?.includes(op.uid) ? "played" : ""}
                                        ${player.swappableAttack === op.uid ? "swappable" : ""}`}
                                        src={getImage(op)}
                                        alt={op.name}
                                        title={op.name}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
            <div className="overlay-teamview overlay-teamview-right">
                {Object.entries(teamData)
                    .filter(([tid]) => tid !== uid)
                    .filter(([_, player]) => (player.defense?.chosen?.length ?? 0) > 0)
                    .map(([tid, player]) => (
                        <div key={tid} className="overlay-teammate">
                            <div className="overlay-teammate-name">{player.name || tid}</div>
                            <div className="overlay-teammate-ops">
                                {(player.defense?.chosen || []).map((op) => (
                                    <img
                                        key={op.uid}
                                        className={`overlay-icon
                                        ${player.defense?.locked?.includes(op.uid) ? "locked" : ""}
                                        ${player.defense?.rerolled?.includes(op.uid) ? "rerolled" : ""}
                                        ${player.defense?.played?.includes(op.uid) ? "played" : ""}
                                        ${player.swappableDefense === op.uid ? "swappable" : ""}`}
                                        src={getImage(op)}
                                        alt={op.name}
                                        title={op.name}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}