import {HashRouter, Route, Routes, useLocation} from "react-router-dom";
import React, {useEffect} from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Overlay from "./Overlay";

function BodyClassManager() {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/overlay") {
            document.body.classList.add("overlay-mode");
        } else {
            document.body.classList.remove("overlay-mode");
        }
    }, [location]);

    return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode>
    <HashRouter basename="/">
        <BodyClassManager/>
        <Routes>
            <Route path="/" element={<App/>}/>
            <Route path="/overlay" element={<Overlay/>}/>
        </Routes>
    </HashRouter>
</React.StrictMode>);
