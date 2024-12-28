import { useEffect, useState } from "react";
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
    const [sunScale, setSunScale] = useState(10);
    const [selectedPlanet, setSelectedPlanet] =
        useState(null);

    const [renderer, setRenderer] = useState(
        new THREE.WebGLRenderer()
    );
    const [scene, setScene] = useState(new THREE.Scene());
    const [textureLoader, setTextureLoader] = useState(
        new THREE.TextureLoader()
    );

    const [
        cameraInitialPosition,
        setCameraInitialPosition,
    ] = useState(new THREE.Vector3(-1000, 5000, 11000));
    const [cameraInitialTarget, setCameraInitialTarget] =
        useState(new THREE.Vector3(0, 0, 0));

    const [camera, setCamera] = useState(
        new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            500000
        )
    );
    camera.position.copy(cameraInitialPosition);

    const [navigation, setNavigation] = useState(
        new OrbitControls(camera, renderer.domElement)
    );

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
        renderer.setAnimationLoop((time) => {
            data.find(
                (planet) => planet.name === "Sun"
            ).mesh.rotateY(0.004 * speed);
            data.filter(
                (planet) => planet.name !== "Sun"
            ).forEach((planet) => {
                planet.object3d.rotateY(
                    planet.orbitSpeed * speed
                );
                planet.mesh.rotateY(
                    planet.rotatingSpeed * speed
                );
            });

            if (selectedPlanet) {
                const planetWorldPosition =
                    new THREE.Vector3();
                selectedPlanet.mesh.getWorldPosition(
                    planetWorldPosition
                );

                const rate = planetScale < 10 ? 0.0001 : 2;
                const distance =
                    ((selectedPlanet.radius * rate) /
                        scale) *
                    planetScale;
                const cameraPosition = new THREE.Vector3(
                    planetWorldPosition.x + distance,
                    planetWorldPosition.y + distance,
                    planetWorldPosition.z + distance
                );

                camera.position.lerp(cameraPosition, 0.1);
                navigation.target.copy(planetWorldPosition);
                navigation.update();
            }

            renderer.render(scene, camera);
        });
    }, [selectedPlanet, speed, planetScale]);

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

    useEffect(() => {
        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

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
            planet.mesh.position.set(
                planet.distance / scale,
                0,
                0
            );
            planet.mesh.name = planet.name;

            planet.object3d = new THREE.Object3D();
            planet.object3d.add(planet.mesh);

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

            scene.add(planet.object3d);
            createLineLoopWithMesh(
                planet.distance / scale,
                planet.color || 0x005300,
                1
            );
            return planet;
        };

        // Update planets map to pass planetData directly
        const planets = data
            .filter((planet) => planet.name !== "Sun")
            .map((planetData) => {
                return generatePlanet(planetData);
            });

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

        gui.add(options, "Sun scale", 1, 10).onChange(
            (e) => {
                let newScale = Math.round(e);
                setSunScale(newScale);
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

        gui.add(
            options,
            "Speed",
            0,
            maxSpeed ? maxSpeed : 20
        ).onChange((e) => {
            setSpeed(e);
            return e;
        });

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
