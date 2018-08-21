# opensphere-plugin-geopackage

GeoPackage support for to [OpenSphere](https://github.com/ngageoint/opensphere).

## Getting Started

For ease of development, we have created [opensphere-yarn-workspace](https://github.com/ngageoint/opensphere-yarn-workspace)
which assists in developing across multiple projects.

After you set that up, your directory structure should look like this:
```
opensphere-yarn-workspace/ # your clone of opensphere-yarn-workspace
  workspace/
    opensphere/ # your clone of OpenSphere
    opensphere-plugin-geopackage/ # this project
```

Run `yarn` to install dependencies.

## Things that work

- Tiled imagery in configured application projections (generally EPSG:3857 and EPSG:4326 by default)
- Vector features
- Export of vector features to GeoPackage

## Caveats

Building the web version of OpenSphere still limits the file size to 100MB. The Electron version will soon support
large GeoPackage files.

## Tips

After loading tiled imagery with a small coverage area, right-click the layer and select 'Go To'. That will get
you close and you can zoom in a little further to see the imagery.
