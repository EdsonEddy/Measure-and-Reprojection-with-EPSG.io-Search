import Map from 'ol/Map';
import View from 'ol/View';
import {
  Circle as CircleStyle,
  Fill,
  RegularShape,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import {Draw, Modify} from 'ol/interaction';
import {LineString, Point} from 'ol/geom';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {getArea, getLength} from 'ol/sphere';

import Graticule from 'ol/layer/Graticule';
import TileDebug from 'ol/source/TileDebug';
import proj4 from 'proj4';
import {applyTransform} from 'ol/extent';
import {get as getProjection, getTransform} from 'ol/proj';
import {register} from 'ol/proj/proj4';

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: '14px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
  text: new Text({
    text: 'Drag to modify',
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const segmentStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textBaseline: 'bottom',
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
});

const segmentStyles = [segmentStyle];

const formatLength = function (line) {
  const length = getLength(line);
  return '' + length.toFixed(2);
};

const formatArea = function (polygon) {
  const area = getArea(polygon);
  return '' + area.toFixed(2);
};

const osmSource = new OSM();

const debugLayer = new TileLayer({
  source: new TileDebug({
    tileGrid: osmSource.getTileGrid(),
    projection: osmSource.getProjection(),
  }),
  visible: false,
});

const graticule = new Graticule({
  // the style to use for the lines, optional.
  strokeStyle: new Stroke({
    color: 'rgba(255,120,0,0.9)',
    width: 2,
    lineDash: [0.5, 4],
  }),
  showLabels: true,
  visible: false,
  wrapX: false,
});


const source = new VectorSource();

const vector = new VectorLayer({
  source: source,
  style: function (feature) {
    return styleFunction(feature, showSegments.checked);
  },
});

const map = new Map({
  layers: [
    new TileLayer({
      source: osmSource,
    }),
    debugLayer,
    graticule,
    vector,
  ],
  target: 'map',
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 1,
  }),
});

const queryInput = document.getElementById('epsg-query');
const searchButton = document.getElementById('epsg-search');
const resultSpan = document.getElementById('epsg-result');
const renderEdgesCheckbox = document.getElementById('render-edges');
const showTilesCheckbox = document.getElementById('show-tiles');
const showGraticuleCheckbox = document.getElementById('show-graticule');

function setProjection(code, name, proj4def, bbox) {
  if (code === null || name === null || proj4def === null || bbox === null) {
    resultSpan.innerHTML = 'Nothing usable found, using EPSG:3857...';
    map.setView(
      new View({
        projection: 'EPSG:3857',
        center: [0, 0],
        zoom: 1,
      })
    );
    return;
  }

  resultSpan.innerHTML = '(' + code + ') ' + name;

  const newProjCode = 'EPSG:' + code;
  proj4.defs(newProjCode, proj4def);
  register(proj4);
  const newProj = getProjection(newProjCode);
  const fromLonLat = getTransform('EPSG:4326', newProj);

  let worldExtent = [bbox[1], bbox[2], bbox[3], bbox[0]];
  newProj.setWorldExtent(worldExtent);

  // approximate calculation of projection extent,
  // checking if the world extent crosses the dateline
  if (bbox[1] > bbox[3]) {
    worldExtent = [bbox[1], bbox[2], bbox[3] + 360, bbox[0]];
  }
  const extent = applyTransform(worldExtent, fromLonLat, undefined, 8);
  newProj.setExtent(extent);
  const newView = new View({
    projection: newProj,
  });
  map.setView(newView);
  newView.fit(extent);
}

function search(query) {
  resultSpan.innerHTML = 'Searching ...';
  fetch('https://epsg.io/?format=json&q=' + query)
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      const results = json['results'];
      if (results && results.length > 0) {
        for (let i = 0, ii = results.length; i < ii; i++) {
          const result = results[i];
          if (result) {
            const code = result['code'];
            const name = result['name'];
            const proj4def = result['proj4'];
            const bbox = result['bbox'];
            if (
              code &&
              code.length > 0 &&
              proj4def &&
              proj4def.length > 0 &&
              bbox &&
              bbox.length == 4
            ) {
              setProjection(code, name, proj4def, bbox);
              document.getElementById('epsg').innerHTML = map.getView().getProjection().getCode();
              document.getElementById('units').innerHTML = map.getView().getProjection().getUnits();
              return;
            }
          }
        }
      }
      setProjection(null, null, null, null);
    });
}

/**
 * Handle click event.
 * @param {Event} event The event.
 */
searchButton.onclick = function (event) {
  search(queryInput.value);
  event.preventDefault();
};

/**
 * Handle checkbox change events.
 */
function onReprojectionChange() {
  osmSource.setRenderReprojectionEdges(renderEdgesCheckbox.checked);
}
function onGraticuleChange() {
  graticule.setVisible(showGraticuleCheckbox.checked);
}
function onTilesChange() {
  debugLayer.setVisible(showTilesCheckbox.checked);
}
showGraticuleCheckbox.addEventListener('change', onGraticuleChange);
renderEdgesCheckbox.addEventListener('change', onReprojectionChange);
showTilesCheckbox.addEventListener('change', onTilesChange);

onReprojectionChange();
onGraticuleChange();
onTilesChange();

const typeSelect = document.getElementById('type');
const showSegments = document.getElementById('segments');
const clearPrevious = document.getElementById('clear');

const modify = new Modify({source: source, style: modifyStyle});

let tipPoint;

function styleFunction(feature, segments, drawType, tip) {
  const styles = [style];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type) {
    if (type === 'Polygon') {
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === 'LineString') {
      point = new Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    let count = 0;
    line.forEachSegment(function (a, b) {
      const segment = new LineString([a, b]);
      const label = formatLength(segment);
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  if (
    tip &&
    type === 'Point' &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tipStyle.getText().setText(tip);
    styles.push(tipStyle);
  }
  return styles;
}

map.addInteraction(modify);

let draw; // global so we can remove it later

function addInteraction() {
  const drawType = typeSelect.value;
  const activeTip =
    'Click to continue drawing the ' +
    (drawType === 'Polygon' ? 'polygon' : 'line');
  const idleTip = 'Click to start measuring';
  let tip = idleTip;
  draw = new Draw({
    source: source,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });
  draw.on('drawstart', function () {
    if (clearPrevious.checked) {
      source.clear();
    }
    modify.setActive(false);
    tip = activeTip;
  });
  draw.on('drawend', function () {
    modifyStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once('pointermove', function () {
      modifyStyle.setGeometry();
    });
    tip = idleTip;
  });
  modify.setActive(true);
  map.addInteraction(draw);
}

typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();

showSegments.onchange = function () {
  vector.changed();
  draw.getOverlay().changed();
};


