import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";

const SolarSystem = ({ options }) => {
    const { speed, showOrbits, lighting, scale } = options;
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
        const sunTexture = textureLoader.load(
            "/assets/sun.jpg"
        );
        const mercuryTexture = textureLoader.load(
            "/assets/mercury.jpg"
        );
        const venusTexture = textureLoader.load(
            "/assets/venus.jpg"
        );
        const earthTexture = textureLoader.load(
            "/assets/earth.jpg"
        );
        const marsTexture = textureLoader.load(
            "/assets/mars.jpg"
        );
        const jupiterTexture = textureLoader.load(
            "/assets/jupiter.jpg"
        );
        const saturnTexture = textureLoader.load(
            "/assets/saturn.jpg"
        );
        const uranusTexture = textureLoader.load(
            "/assets/uranus.jpg"
        );
        const neptuneTexture = textureLoader.load(
            "/assets/neptune.jpg"
        );
        const plutoTexture = textureLoader.load(
            "/assets/pluto.jpg"
        );
        const saturnRingTexture = textureLoader.load(
            "/assets/saturn_ring.png"
        );
        const uranusRingTexture = textureLoader.load(
            "/assets/uranus_ring.png"
        );

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(-50, 90, 150);

        const navigation = new OrbitControls(
            camera,
            renderer.domElement
        );

        const cubeTextureLoader =
            new THREE.CubeTextureLoader();
        const cubeTexture = cubeTextureLoader.load([
            "/src/assets/stars.jpg",
            "/src/assets/stars.jpg",
            "/src/assets/stars.jpg",
            "/src/assets/stars.jpg",
            "/src/assets/stars.jpg",
            "/src/assets/stars.jpg",
        ]);
        scene.background = cubeTexture;

        const sungeo = new THREE.SphereGeometry(
            10.9,
            50,
            50
        );
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: sunTexture,
        });
        const sun = new THREE.Mesh(sungeo, sunMaterial);
        scene.add(sun);

        const sunLight = new THREE.PointLight(
            0xffffff,
            4,
            300
        );
        sunLight.castShadow = true;
        scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(
            0xffffff,
            0
        );
        scene.add(ambientLight);

        const path_of_planets = [];
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
            path_of_planets.push(lineLoop);
        };

        const generatePlanet = (
            size,
            planetTexture,
            position,
            ring
        ) => {
            const planetGeometry = new THREE.SphereGeometry(
                size * scale,
                50,
                50
            );
            const planetMaterial =
                new THREE.MeshStandardMaterial({
                    map: planetTexture,
                });
            const planet = new THREE.Mesh(
                planetGeometry,
                planetMaterial
            );
            planet.castShadow = true;
            planet.receiveShadow = true;
            const planetObj = new THREE.Object3D();
            planet.position.set(position.x, position.y, 0);
            planetObj.add(planet);

            if (ring) {
                const ringGeometry = new THREE.RingGeometry(
                    ring.innerRadius*scale,
                    ring.outerRadius*scale,
                    32
                );
                const ringMaterial =
                    new THREE.MeshStandardMaterial({
                        normalMap: ring.ringmat,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.6,
                    });
                ringMaterial.castShadow = true;
                const ringMesh = new THREE.Mesh(
                    ringGeometry,
                    ringMaterial
                );
                ringMesh.receiveShadow = true;
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.position.set(
                    position.x,
                    position.y,
                    0
                );
                planetObj.add(ringMesh);
            }

            scene.add(planetObj);
            createLineLoopWithMesh(position.x, 0x005300, 1);
            return { planetObj, planet };
        };

        const planets = [
            {
                ...generatePlanet(
                    191 / 5000,
                    mercuryTexture,
                    {
                        x: 28,
                        y: 0,
                    }
                ),
                rotaing_speed_around_sun: 0.004,
                self_rotation_speed: 0.004,
            },
            {
                ...generatePlanet(
                    949 / 10000,
                    venusTexture,
                    {
                        x: 44,
                        y: 0,
                    }
                ),
                rotaing_speed_around_sun: 0.015,
                self_rotation_speed: 0.002,
            },
            {
                ...generatePlanet(0.1, earthTexture, {
                    x: 62,
                    y: 0,
                }),
                rotaing_speed_around_sun: 0.01,
                self_rotation_speed: 0.02,
            },
            {
                ...generatePlanet(53 / 1000, marsTexture, {
                    x: 78,
                    y: 0,
                }),
                rotaing_speed_around_sun: 0.008,
                self_rotation_speed: 0.018,
            },
            {
                ...generatePlanet(28 / 25, jupiterTexture, {
                    x: 100,
                    y: 0,
                }),
                rotaing_speed_around_sun: 0.002,
                self_rotation_speed: 0.04,
            },
            {
                ...generatePlanet(
                    941 / 1000,
                    saturnTexture,
                    { x: 138, y: 0 },
                    {
                        innerRadius: 941 / 1000,
                        outerRadius: (941 / 1000) * 2,
                        ringmat: saturnRingTexture,
                    }
                ),
                rotaing_speed_around_sun: 0.0009,
                self_rotation_speed: 0.038,
            },
            {
                ...generatePlanet(
                    199 / 500,
                    uranusTexture,
                    { x: 176, y: 0 },
                    {
                        innerRadius: 199 / 500,
                        outerRadius: (199 / 500) * (7 / 12),
                        ringmat: uranusRingTexture,
                    }
                ),
                rotaing_speed_around_sun: 0.0004,
                self_rotation_speed: 0.03,
            },
            {
                ...generatePlanet(
                    381 / 1000,
                    neptuneTexture,
                    {
                        x: 200,
                        y: 0,
                    }
                ),
                rotaing_speed_around_sun: 0.0001,
                self_rotation_speed: 0.032,
            },
            {
                ...generatePlanet(93 / 5000, plutoTexture, {
                    x: 216,
                    y: 0,
                }),
                rotaing_speed_around_sun: 0.0007,
                self_rotation_speed: 0.008,
            },
        ];

        const gui = new GUI();
        const options = {
            "Turn lights": turnLights(
                ambientLight,
                lighting
            ),
            "Show orbits": turnOrbits(
                path_of_planets,
                showOrbits
            ),
            "speed": speed,
        };
        gui.add(options, "Turn lights").onChange((e) => {
            turnLights(ambientLight, e);
        });
        gui.add(options, "Show orbits").onChange((e) => {
            turnOrbits(path_of_planets, e);
        });
        const maxSpeed =
            new URL(window.location.href).searchParams.get(
                "ms"
            ) * 1;
        gui.add(
            options,
            "speed",
            0,
            maxSpeed ? maxSpeed : 20
        );

        const animate = (time) => {
            sun.rotateY(options.speed * 0.004);
            planets.forEach(
                ({
                    planetObj,
                    planet,
                    rotaing_speed_around_sun,
                    self_rotation_speed,
                }) => {
                    planetObj.rotateY(
                        rotaing_speed_around_sun *
                            options.speed
                    );
                    planet.rotateY(
                        self_rotation_speed * options.speed
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

    const turnOrbits = (path_of_planets, e) => {
        path_of_planets.forEach((dpath) => {
            dpath.visible = e;
        });
        return e;
    };

    const turnLights = (ambientLight, e) => {
        ambientLight.intensity = e ? 0 : 0.5;
        return e;
    };

    return <div />;
};

export default SolarSystem;
