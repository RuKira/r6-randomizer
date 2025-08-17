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

  const [locked, setLocked] = useState({ attack: [], defense: [] });
  const [rerolled, setRerolled] = useState({ attack: [], defense: [] });
  const [played, setPlayed] = useState({ attack: [], defense: [] });

  const [swappableAttack, setSwappableAttack] = useState(null);
  const [swappableDefense, setSwappableDefense] = useState(null);

  const getImage = (op) =>
    op.image ||
    `images/operators/${op.name.toLowerCase().replace(/[^a-z0-9]/gi, "")}.png`;

  const getClasses = (op, side) => {
    let cls = "overlay-icon";
    if (locked[side]?.includes(op.uid)) cls += " locked";
    if (rerolled[side]?.includes(op.uid)) cls += " rerolled";
    if (played[side]?.includes(op.uid)) cls += " played";
    if (side === "attack" && swappableAttack === op.uid) cls += " swappable";
    if (side === "defense" && swappableDefense === op.uid) cls += " swappable";
    return cls;
  };

  useEffect(() => {
    if (!teamCode || !uid) return;

    const refPath = `teams/${teamCode}/${uid}`;
    const teamRef = ref(db, refPath);

    const unsubscribe = onValue(teamRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setAttackers(data.attack?.chosen || []);
      setDefenders(data.defense?.chosen || []);

      setLocked({
        attack: data.attack?.locked || [],
        defense: data.defense?.locked || [],
      });
      setRerolled({
        attack: data.attack?.rerolled || [],
        defense: data.defense?.rerolled || [],
      });
      setPlayed({
        attack: data.attack?.played || [],
        defense: data.defense?.played || [],
      });

      setSwappableAttack(data.swappableAttack || null);
      setSwappableDefense(data.swappableDefense || null);
    });

    return () => off(teamRef, "value", unsubscribe);
  }, [teamCode, uid]);

  return (
    <div className="overlay-container">
      {/* Left column: attackers */}
      <div className="overlay-column left">
        {attackers.map((op) => (
          <img
            key={op.uid}
            className={getClasses(op, "attack")}
            src={getImage(op)}
            alt={op.name}
            title={op.name}
          />
        ))}
      </div>

      {/* Right column: defenders */}
      <div className="overlay-column right">
        {defenders.map((op) => (
          <img
            key={op.uid}
            className={getClasses(op, "defense")}
            src={getImage(op)}
            alt={op.name}
            title={op.name}
          />
        ))}
      </div>
    </div>
  );
}