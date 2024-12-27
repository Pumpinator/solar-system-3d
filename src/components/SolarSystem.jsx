import { useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import solarSystem from "../data/solarSystem";

const SolarSystem = ({ options }) => {
    const [data, setData] = useState(solarSystem);
    const [orbits, setOrbits] = useState([]);
    const [scene, setScene] = useState(new THREE.Scene());
    const [planetScale, setPlanetScale] = useState(100);
    const [renderer, setRenderer] = useState(
        new THREE.WebGLRenderer()
    );
    const [textureLoader, setTextureLoader] = useState(
        new THREE.TextureLoader()
    );
    const [cubeTextureLoader, setCubeTextureLoader] =
        useState(new THREE.CubeTextureLoader());
    const { speed, showOrbits, scale } = options;

    useEffect(() => {
        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            500000
        );
        camera.position.set(-50, 90, 150);

        const navigation = new OrbitControls(
            camera,
            renderer.domElement
        );

        const stars = data.shift();
        const starsTexture = cubeTextureLoader.load([
            `/assets/${stars.texture}`,
            `/assets/${stars.texture}`,
            `/assets/${stars.texture}`,
            `/assets/${stars.texture}`,
            `/assets/${stars.texture}`,
            `/assets/${stars.texture}`,
        ]);
        scene.background = starsTexture;

        const ambientLight = new THREE.AmbientLight(
            0xffffff,
            0.5
        );
        scene.add(ambientLight);

        const sun = data.shift();
        sun.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(
                sun.radius / scale,
                50,
                50
            ),
            new THREE.MeshStandardMaterial({
                map: textureLoader.load(
                    `/assets/${sun.texture}`
                ),
            })
        );
        sun.mesh.castShadow = true;
        sun.mesh.receiveShadow = true;
        scene.add(sun.mesh);

        sun.light = new THREE.PointLight(0xffffff, 10, 0);
        sun.light.position.set(0, 0, 0);
        sun.light.castShadow = true;
        sun.light.shadow.mapSize.width = 1024;
        sun.light.shadow.mapSize.height = 1024;
        scene.add(sun.light);

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

        const createPlanet = (planet) => {
            const angle = Math.random() * Math.PI * 2; // Ángulo aleatorio en radianes
            const x =
                Math.cos(angle) * (planet.distance / scale);
            const z =
                Math.sin(angle) * (planet.distance / scale);

            planet.mesh = new THREE.Mesh(
                new THREE.SphereGeometry(
                    (planet.radius / scale) * planetScale,
                    50,
                    50
                ),
                new THREE.MeshStandardMaterial({
                    map: textureLoader.load(
                        `/assets/${planet.texture}`
                    ),
                })
            );
            planet.mesh.castShadow = true;
            planet.mesh.receiveShadow = true;
            planet.mesh.position.set(x, 0, z);
            planet.object3d = new THREE.Object3D();
            planet.object3d.add(planet.mesh);

            if (planet.ring) {
                planet.ring.mesh = new THREE.Mesh(
                    new THREE.RingGeometry(
                        (planet.ring.innerRadius / scale) *
                            planetScale,
                        (planet.ring.outerRadius / scale) *
                            planetScale,
                        32
                    ),
                    new THREE.MeshStandardMaterial({
                        map: textureLoader.load(
                            `/assets/${planet.ring.texture}`
                        ),
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: planet.ring.opacity,
                    })
                );
                planet.ring.mesh.castShadow = true;
                planet.ring.mesh.receiveShadow = true;
                planet.ring.mesh.rotation.x = Math.PI / 2;
                planet.ring.mesh.position.set(x, 0, z);
                planet.object3d.add(planet.ring.mesh);
            }

            scene.add(planet.object3d);
            createLineLoopWithMesh(
                planet.distance / scale,
                planet.color,
                1
            );
            return planet;
        };

        data.forEach((planet, index) => {
            data[index] = createPlanet(planet);
        });

        const gui = new GUI();

        const options = {
            "Show orbits": turnOrbits(showOrbits),
            "Turn stars": true,
            "Planet scale": planetScale,
            Speed: speed,
        };

        gui.add(options, "Turn stars").onChange((e) => {
            turnStars(starsTexture, e);
        });

        gui.add(options, "Show orbits").onChange((e) => {
            turnOrbits(e);
        });

        gui.add(options, "Planet scale", 1, 100).onChange(
            (e) => {
                const newScale = Math.round(e);
                setPlanetScale(scale);
                data.forEach((planet) => {
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

        renderer.setAnimationLoop((time) => {
            sun.mesh.rotateY(options.Speed * 0.004);
            data.forEach((planet) => {
                planet.object3d.rotateY(
                    planet.orbitSpeed * options.Speed
                );
                planet.object3d.rotateY(
                    planet.rotatingSpeed * options.Speed
                );
            });
            renderer.render(scene, camera);
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

    const turnOrbits = (e) => {
        orbits.forEach((dpath) => {
            dpath.visible = e;
        });
        return e;
    };

    const turnStars = (starsTexture, e) => {
        if (!e) scene.background = null;
        else scene.background = starsTexture;
        return e;
    };

    return <div />;
};

export default SolarSystem;
