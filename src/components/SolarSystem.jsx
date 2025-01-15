import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import solarSystem from "../data/solarSystem";

const SolarSystem = () => {
    const [data, setData] = useState(solarSystem);
    const [orbits, setOrbits] = useState([]);
    const [showOrbits, setShowOrbits] = useState(true);
    const [showStars, setShowStars] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [scale, setScale] = useState(100000);
    const [planetScale, setPlanetScale] = useState(500);
    const [sunScale, setSunScale] = useState(1);
    const [selectedPlanet, setSelectedPlanet] =
        useState(null);
    const [isUserInteracting, setIsUserInteracting] =
        useState(false);
    const [cameraDistance, setCameraDistance] = useState(0);

    const [renderer, setRenderer] = useState(
        new THREE.WebGLRenderer()
    );
    const [scene, setScene] = useState(new THREE.Scene());
    const [textureLoader, setTextureLoader] = useState(
        new THREE.TextureLoader()
    );

    const cameraInitialPosition = new THREE.Vector3(
        -2000,
        6000,
        12000
    );
    const cameraInitialTarget = new THREE.Vector3(0, 0, 0);

    const cameraRef = useRef(
        new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            500000
        )
    );
    const navigationRef = useRef(null);

    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const starsTexture = cubeTextureLoader.load([
        "/assets/stars.jpg",
        "/assets/stars.jpg",
        "/assets/stars.jpg",
        "/assets/stars.jpg",
        "/assets/stars.jpg",
        "/assets/stars.jpg",
    ]);

    useEffect(() => {
        const camera = cameraRef.current;
        camera.position.copy(cameraInitialPosition);

        const navigation = new OrbitControls(
            camera,
            renderer.domElement
        );
        navigation.target.copy(cameraInitialTarget);
        navigation.enableDamping = true;
        navigation.dampingFactor = 0.05;
        navigation.screenSpacePanning = false;
        navigation.minDistance = 10;
        navigation.maxDistance = 500000;
        navigation.maxPolarAngle = Math.PI / 2;
        navigationRef.current = navigation;

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        return () => {
            window.removeEventListener("resize", () => {
                renderer.setSize(
                    window.innerWidth,
                    window.innerHeight
                );
            });
            document.body.removeChild(renderer.domElement);
        };
    }, [renderer]);

    useEffect(() => {
        const camera = cameraRef.current;
        const navigation = navigationRef.current;

        const sun = data.find((d) => d.name === "Sun");
        const sunGeometry = new THREE.SphereGeometry(
            (sun.radius / scale) * sunScale,
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

        const ambientLight = new THREE.AmbientLight(
            0x404040,
            0
        );
        scene.add(ambientLight);

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
            const angle = Math.random() * Math.PI * 2;
            const x =
                Math.cos(angle) * (planet.distance / scale);
            const z =
                Math.sin(angle) * (planet.distance / scale);
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
            planet.mesh.position.set(x, 0, z);
            planet.mesh.name = planet.name;

            planet.object3d = new THREE.Object3D();
            planet.object3d.add(planet.mesh);

            if (planet.ring) generateRing(planet);

            scene.add(planet.object3d);
            createLineLoopWithMesh(
                planet.distance / scale,
                planet.color || 0x005300,
                1
            );

            if (planet.satellites)
                generateSatellite(planet);

            return planet;
        };

        const generateRing = (planet) => {
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
        };

        const generateSatellite = (planet) => {
            planet.satellites.forEach((satellite) => {
                const angle = Math.random() * Math.PI * 2;
                const x =
                    Math.cos(angle) *
                    (satellite.distance / scale);
                const z =
                    Math.sin(angle) *
                    (satellite.distance / scale);
                const satelliteGeometry =
                    new THREE.SphereGeometry(
                        (satellite.radius / scale) *
                            planetScale,
                        50,
                        50
                    );
                const satelliteMaterial =
                    new THREE.MeshStandardMaterial({
                        map: textureLoader.load(
                            `/assets/${satellite.texture}`
                        ),
                    });
                satellite.mesh = new THREE.Mesh(
                    satelliteGeometry,
                    satelliteMaterial
                );
                satellite.mesh.castShadow = true;
                satellite.mesh.receiveShadow = true;
                satellite.mesh.position.set(x, 0, z);
                satellite.mesh.name = satellite.name;

                satellite.object3d = new THREE.Object3D();
                satellite.object3d.add(satellite.mesh);

                planet.mesh.add(satellite.object3d);

                createLineLoopWithMesh(
                    satellite.distance / scale,
                    satellite.color || 0x005300,
                    1
                );
            });
        };

        data.filter((planet) => planet.name !== "Sun").map(
            (planetData) => {
                return generatePlanet(planetData);
            }
        );

        const gui = new GUI();
        const options = {
            "Reset camera": () => {
                setSelectedPlanet(null);
                camera.position.copy(cameraInitialPosition);
                navigation.target.copy(cameraInitialTarget);
                navigation.update();
            },
            "Show stars": showStars,
            "Show orbits": showOrbits,
            "Planet scale": planetScale,
            "Sun scale": sunScale,
            Speed: speed,
        };

        gui.add(options, "Reset camera");

        gui.add(options, "Show stars").onChange((e) => {
            setShowStars(e);
            return e;
        });

        gui.add(options, "Show orbits").onChange((e) => {
            setShowOrbits(e);
            return e;
        });

        gui.add(options, "Planet scale", 1, 1000).onChange(
            (e) => {
                let newScale = Math.round(e);
                setPlanetScale(newScale);
                data.filter(
                    (planet) => planet.name !== "Sun"
                ).forEach((planet) => {
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

                    if (planet.satellites) {
                        planet.satellites.forEach(
                            (satellite) => {
                                satellite.mesh.geometry.dispose();
                                satellite.mesh.geometry =
                                    new THREE.SphereGeometry(
                                        (satellite.radius /
                                            scale) *
                                            newScale,
                                        50,
                                        50
                                    );
                            }
                        );
                    }
                });
            }
        );

        gui.add(options, "Sun scale", 1, 10).onChange(
            (e) => {
                let newScale = Math.round(e);
                setSunScale(newScale);
                let sun = data.find(
                    (d) => d.name === "Sun"
                );
                sun.mesh.geometry.dispose();
                sun.mesh.geometry =
                    new THREE.SphereGeometry(
                        (sun.radius / scale) * newScale,
                        50,
                        50
                    );
            }
        );

        const maxSpeed =
            new URL(window.location.href).searchParams.get(
                "ms"
            ) * 1;

        gui.add(options, "Speed", 0, 100000).onChange(
            (e) => {
                setSpeed(e);
                return e;
            }
        );

        window.addEventListener("click", (e) => {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            mouse.x =
                (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y =
                -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(
                scene.children,
                true
            );

            if (intersects.length > 0) {
                const object = intersects[0].object;
                const clickedPlanet = data.find(
                    (p) => p.name === object.name
                );
                if (clickedPlanet) {
                    setSelectedPlanet(clickedPlanet);
                }
            }
        });

        window.addEventListener("touchend", (e) => {
            const raycaster = new THREE.Raycaster();
            const touch = e.changedTouches[0];
            const rect =
                renderer.domElement.getBoundingClientRect();
            const x =
                ((touch.clientX - rect.left) / rect.width) *
                    2 -
                1;
            const y =
                -(
                    (touch.clientY - rect.top) /
                    rect.height
                ) *
                    2 +
                1;
            raycaster.setFromCamera(
                new THREE.Vector2(x, y),
                camera
            );
            const intersects = raycaster.intersectObjects(
                scene.children,
                true
            );
            if (intersects.length > 0) {
                const object = intersects[0].object;
                const clickedPlanet = data.find(
                    (p) => p.name === object.name
                );
                if (clickedPlanet) {
                    setSelectedPlanet(clickedPlanet);
                }
            }
        });
    }, []);

    useEffect(() => {
        const handleMouseDown = () =>
            setIsUserInteracting(true);
        const handleMouseUp = () =>
            setIsUserInteracting(false);
        const handleWheel = (event) => {
            setIsUserInteracting(true);
            setCameraDistance(
                (prevDistance) =>
                    prevDistance - event.deltaY * 0.1
            );
        };
        const handleMouseClick = () =>
            setIsUserInteracting(false);

        window.addEventListener(
            "mousedown",
            handleMouseDown
        );
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("wheel", handleWheel);
        window.addEventListener("click", handleMouseClick);

        return () => {
            window.removeEventListener(
                "mousedown",
                handleMouseDown
            );
            window.removeEventListener(
                "mouseup",
                handleMouseUp
            );
            window.removeEventListener(
                "wheel",
                handleWheel
            );
            window.removeEventListener(
                "click",
                handleMouseClick
            );
        };
    }, []);

    useEffect(() => {
        const camera = cameraRef.current;
        const navigation = navigationRef.current;
        renderer.setAnimationLoop((time) => {
            data.find(
                (planet) => planet.name === "Sun"
            ).mesh.rotateY(0.004 * speed);
            data.filter(
                (planet) => planet.name !== "Sun"
            ).forEach((planet) => {
                planet.object3d.rotateY(
                    (planet.orbitSpeed / scale) * speed
                );
                planet.mesh.rotateY(
                    (planet.rotatingSpeed / scale) * speed
                );

                if (planet.satelites) {
                    planet.satelites.forEach(
                        (satellite) => {
                            satellite.object3d.rotateY(
                                (satellite.orbitSpeed /
                                    scale) *
                                    speed
                            );
                            satellite.mesh.rotateY(
                                (satellite.rotatingSpeed /
                                    scale) *
                                    speed
                            );
                        }
                    );
                }
            });

            if (selectedPlanet) {
                const planetWorldPosition =
                    new THREE.Vector3();
                selectedPlanet.mesh.getWorldPosition(
                    planetWorldPosition
                );

                if (!isUserInteracting) {
                    const rate =
                        planetScale < 10 ? 0.0001 : 2;
                    const distance =
                        ((selectedPlanet.radius * rate) /
                            scale) *
                            planetScale +
                        cameraDistance;
                    const cameraPosition =
                        new THREE.Vector3(
                            planetWorldPosition.x +
                                distance,
                            planetWorldPosition.y +
                                distance,
                            planetWorldPosition.z + distance
                        );

                    camera.position.lerp(
                        cameraPosition,
                        0.1
                    );
                    navigation.target.copy(
                        planetWorldPosition
                    );
                    navigation.update();
                } else {
                    navigation.target.copy(
                        planetWorldPosition
                    );
                    navigation.update();
                }
            }

            renderer.render(scene, camera);
        });
    }, [
        selectedPlanet,
        speed,
        planetScale,
        isUserInteracting,
        cameraDistance,
    ]);

    useEffect(() => {
        if (selectedPlanet) {
            const planetWorldPosition = new THREE.Vector3();
            selectedPlanet.mesh.getWorldPosition(
                planetWorldPosition
            );

            const rate = planetScale < 10 ? 0.0001 : 2;
            const distance =
                ((selectedPlanet.radius * rate) / scale) *
                    planetScale +
                cameraDistance;
            const cameraPosition = new THREE.Vector3(
                planetWorldPosition.x + distance,
                planetWorldPosition.y + distance,
                planetWorldPosition.z + distance
            );

            cameraRef.current.position.copy(cameraPosition);
        }
    }, [planetScale, sunScale, cameraDistance]);

    useEffect(() => {
        if (showOrbits) {
            orbits.forEach((dpath) => {
                dpath.visible = true;
            });
        } else {
            orbits.forEach((dpath) => {
                dpath.visible = false;
            });
        }
    }, [showOrbits]);

    useEffect(() => {
        if (showStars) {
            scene.background = starsTexture;
        } else {
            scene.background = null;
        }
    }, [showStars]);

    return <div />;
};

export default SolarSystem;
