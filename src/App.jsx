import React, { useState } from "react";
import SolarSystem from "./components/SolarSystem";

const App = () => {
    const [options, setOptions] = useState({
        speed: 0.001,
        showOrbits: true,
        scale: 100000
    });

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
                <SolarSystem options={options} />
            </div>
        </>
    );
};

export default App;
