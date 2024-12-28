import React, { useState } from "react";
import SolarSystem from "./components/SolarSystem";

const App = () => {
    return (
        <>
            <a
                className="instagram"
                href="https://www.instagram.com/alejandroel5"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    src="/instagram.svg"
                    alt="instagram"
                />
            </a>
            <div>
                <SolarSystem />
            </div>
        </>
    );
};

export default App;
