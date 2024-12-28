import { useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import solarSystem from "../data/solarSystem";

const SolarSystem = ({ options }) => {
    const [data, setData] = useState(solarSystem);
    const [orbits, setOrbits] = useState([]);
    const [showOrbits, setShowOrbits] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [scale, setScale] = useState(100000);
    const [planetScale, setPlanetScale] = useState(1000);

    useEffect(() => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        const textureLoader = new THREE.TextureLoader();

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            500000
        );
        camera.position.set(-50, 90, 150);

        const navigation = new OrbitControls(
            camera,
            renderer.domElement
        );

        const cubeTextureLoader =
            new THREE.CubeTextureLoader();
        const starsTexture = cubeTextureLoader.load([
            "/assets/stars.jpg",
            "/assets/stars.jpg",
            "/assets/stars.jpg",
            "/assets/stars.jpg",
            "/assets/stars.jpg",
            "/assets/stars.jpg",
        ]);
        scene.background = starsTexture;

        const sun = data.find((d) => d.name === "Sun");
        const sunGeometry = new THREE.SphereGeometry(
            sun.radius / scale,
            50,
            50
        );
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.load(
                `/assets/${sun.texture}`
            ),
        });
        sun.mesh = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun.mesh);

        const sunLight = new THREE.PointLight(
            0xffffff,
            1,
            Infinity,
            0
        );
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.00001;
        scene.add(sunLight);

        // Reduce ambient light intensity
        const ambientLight = new THREE.AmbientLight(
            0x404040,
            0
        );
        scene.add(ambientLight);

        // Add hemisphere light for better ambient illumination
        const hemisphereLight = new THREE.HemisphereLight(
            0xffffff,
            0x404040,
            0
        );
        scene.add(hemisphereLight);

        const createLineLoopWithMesh = (
            radius,
            color,
            width
        ) => {
            const material = new THREE.LineBasicMaterial({
                color,
                linewidth: width,
            });
            const geometry = new THREE.BufferGeometry();
            const lineLoopPoints = [];

            const numSegments = 100;
            for (let i = 0; i <= numSegments; i++) {
                const angle =
                    (i / numSegments) * Math.PI * 2;
                lineLoopPoints.push(
                    Math.cos(angle) * radius,
                    0,
                    Math.sin(angle) * radius
                );
            }

            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(
                    lineLoopPoints,
                    3
                )
            );
            const lineLoop = new THREE.LineLoop(
                geometry,
                material
            );
            scene.add(lineLoop);
            orbits.push(lineLoop);
        };

        const generatePlanet = (planet) => {
            const planetGeometry = new THREE.SphereGeometry(
                (planet.radius / scale) * planetScale,
                50,
                50
            );
            const planetMaterial =
                new THREE.MeshStandardMaterial({
                    map: textureLoader.load(
                        `/assets/${planet.texture}`
                    ),
                });
            planet.mesh = new THREE.Mesh(
                planetGeometry,
                planetMaterial
            );
            planet.mesh.castShadow = true;
            planet.mesh.receiveShadow = true;

            const planetObj = new THREE.Object3D();
            planet.mesh.position.set(
                planet.distance / scale,
                0,
                0
            );
            planetObj.add(planet.mesh);

            if (planet.ring) {
                const ringGeometry = new THREE.RingGeometry(
                    (planet.ring.innerRadius / scale) *
                        planetScale,
                    (planet.ring.outerRadius / scale) *
                        planetScale,
                    32
                );
                const ringMaterial =
                    new THREE.MeshBasicMaterial({
                        map: textureLoader.load(
                            `/assets/${planet.ring.texture}`
                        ),
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8,
                        blending: THREE.AdditiveBlending,
                        shadow: true,
                        shadowSide: THREE.DoubleSide,
                    });
                planet.ring.mesh = new THREE.Mesh(
                    ringGeometry,
                    ringMaterial
                );
                planet.ring.mesh.receiveShadow = true;
                planet.ring.mesh.rotation.x = Math.PI / 2;
                planet.ring.mesh.position.set(0, 0, 0);
                planet.mesh.add(planet.ring.mesh);
            }

            scene.add(planetObj);
            createLineLoopWithMesh(
                planet.distance / scale,
                planet.color || 0x005300,
                1
            );
            return { planetObj, planet };
        };

        // Update planets map to pass planetData directly
        const planets = data
            .filter((planet) => planet.name !== "Sun")
            .map((planetData) => {
                const planetObj =
                    generatePlanet(planetData);
                return {
                    ...planetObj,
                    orbitSpeed: planetData.orbitSpeed,
                    rotatingSpeed: planetData.rotatingSpeed,
                };
            });

        const turnOrbits = (e) => {
            orbits.forEach((dpath) => {
                dpath.visible = e;
            });
            return e;
        };

        const gui = new GUI();
        const options = {
            "Show orbits": turnOrbits(showOrbits),
            "Turn stars": true,
            "Planet scale": planetScale,
            Speed: speed,
        };

        gui.add(options, "Turn stars").onChange((e) => {
            if (e) {
                scene.background = starsTexture;
            } else {
                scene.background = null;
            }
        });

        gui.add(options, "Show orbits").onChange((e) => {
            turnOrbits(e);
        });

        gui.add(options, "Planet scale", 1, 1000).onChange(
            (e) => {
                let newScale = Math.round(e);
                setPlanetScale(scale);
                data.forEach((planet) => {
                    if (planet.name === "Sun") return;
                    planet.mesh.geometry.dispose();
                    planet.mesh.geometry =
                        new THREE.SphereGeometry(
                            (planet.radius / scale) *
                                newScale,
                            50,
                            50
                        );
                    if (planet.ring) {
                        planet.ring.mesh.geometry.dispose();
                        planet.ring.mesh.geometry =
                            new THREE.RingGeometry(
                                (planet.ring.innerRadius /
                                    scale) *
                                    newScale,
                                (planet.ring.outerRadius /
                                    scale) *
                                    newScale,
                                32
                            );
                    }
                });
            }
        );
        const maxSpeed =
            new URL(window.location.href).searchParams.get(
                "ms"
            ) * 1;
        gui.add(
            options,
            "Speed",
            0,
            maxSpeed ? maxSpeed : 20
        );

        const animate = (time) => {
            sun.mesh.rotateY(options.Speed * 0.004);
            planets.forEach(
                ({
                    planetObj,
                    planet,
                    orbitSpeed,
                    rotatingSpeed,
                }) => {
                    planetObj.rotateY(
                        orbitSpeed * options.Speed
                    );
                    planet.mesh.rotateY(
                        rotatingSpeed * options.Speed
                    );
                }
            );
            renderer.render(scene, camera);
        };
        renderer.setAnimationLoop(animate);

        window.addEventListener("resize", () => {
            camera.aspect =
                window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(
                window.innerWidth,
                window.innerHeight
            );
        });

        return () => {
            document.body.removeChild(renderer.domElement);
        };
    }, []);

    return <div />;
};

export default SolarSystem;
