# Measure and Reprojection with EPSG.io Search

This project is a web-based tool for measuring distances and areas on a map, with support for reprojection using EPSG codes. It allows users to search for coordinate systems via the EPSG.io API and dynamically reproject the map to the selected coordinate system. The tool is built using [OpenLayers](https://openlayers.org/) and includes features such as:

- **Measurement Tools**: Measure lengths (LineString) and areas (Polygon) on the map.
- **Dynamic Reprojection**: Search and apply different coordinate systems using EPSG codes.
- **Graticule and Tile Debugging**: Toggle graticules and tile coordinate overlays for better visualization.
- **Customizable Styles**: Interactive styles for drawing and modifying geometries.
- **Projection Information**: Display the current EPSG code and units of the map.

## Features

- **Search for Projections**: Use the EPSG.io API to search for projections by code or name.
- **Dynamic Map Reprojection**: Reproject the map to the selected coordinate system.
- **Measurement Tools**: Measure distances and areas with options to show segment lengths.
- **Interactive Map Layers**:
  - Graticule layer for latitude/longitude visualization.
  - Tile debug layer to show tile coordinates.
- **Customizable Drawing**: Draw and modify geometries with real-time feedback.

## Technologies Used

- **OpenLayers**: For map rendering and interaction.
- **Proj4**: For handling custom projections.
- **Vite**: For development and build tooling.

## How to Run

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open the application in your browser at `http://localhost:5173`.

## Scripts

- `npm start`: Starts the development server.
- `npm run build`: Builds the project for production.

## File Structure

- **`index.html`**: The main HTML file for the application.
- **`main.js`**: Contains the core logic for map rendering, reprojection, and measurement tools.
- **`package.json`**: Manages dependencies and scripts.

## Dependencies

- [OpenLayers](https://openlayers.org/) (v7.1.0)
- [Proj4](https://github.com/proj4js/proj4js) (v2.8.0)

## License

This project is licensed under the MIT License.