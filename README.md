# Sistema Solar 3D

Este proyecto en construcción es una representación en 3D del Sistema Solar utilizando React, Three.js y Vite.js. Permite visualizar los planetas y sus órbitas, así como ajustar algunas opciones como la velocidad de rotación y la iluminación.

## Tecnologías

- [React](https://reactjs.org/)
- [Three.js](https://threejs.org/)
- [Vite.js](https://vitejs.dev/)
- [dat.GUI](https://github.com/dataarts/dat.gui)

## Pasos para abrir el proyecto en local

1. Clona el repositorio:
    ```sh
    git clone https://github.com/Pumpinator/solar-system-3d.git
    ```
2. Navega al directorio del proyecto:
    ```sh
    cd solar-system-3d
    ```
3. Instala las dependencias:
    ```sh
    npm install
    ```

4. Ejecuta el proyecto en modo de desarrollo:
    ```sh
    npm run dev
    ```

## Estructura del Proyecto

```plaintext
.gitignore
eslint.config.js
index.html
package.json
package-lock.json
public/
    favicon.svg
README.md
src/
    App.jsx
    assets/
        earth.jpg
        jupiter.jpg
        mars.jpg
        mercury.jpg
        neptune.jpg
        pluto.jpg
        saturn_ring.png
        saturn.jpg
        solar-system.png
        stars.jpg
        sun.jpg
        uranus_ring.png
        uranus.jpg
        venus.jpg
    components/
        SolarSystem.jsx
    index.css
    main.jsx
vite.config.js