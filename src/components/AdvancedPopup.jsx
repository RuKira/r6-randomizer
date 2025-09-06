import React, {useEffect} from "react";
import "../styles/advanced.css";

export default function AdvancedPopup({onClose}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    return (<div className="advanced-overlay" onClick={onClose}>
            <div className="advanced-popup" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✖</button>
                <h2>Advanced Settings</h2>
                <p>Placeholder — controls will go here.</p>
            </div>
        </div>);
}
