# Withings GPX export

This project is meant to export cycling or walking activities from Withings to GPX. The GPX file contains the location and heartrate data which can be imported into other platforms such as [Strava](https://www.strava.com/) The application does not store or send any data to any other platform.

![](build/Screenshot_2019-08-16_at_23-c4ba1476-6bd2-4ba6-b582-e007e8490967.55.13.png)

![](build/Screenshot_2019-08-16_at_23-650b7a6a-6b77-4acf-ad8e-3811f81d85e2.55.32.png)

![](build/Screenshot_2019-08-16_at_23-f3e9b9d2-1bb0-4dd4-8b72-8d35ddb8cfc1.55.43.png)

## Download installers

[macOS v0.1.5 alpha](https://github.com/vertongen/withings-gpx/releases/download/v0.1.5-alpha/Withings.gpx.export-0.1.5.dmg) 

[Windows 64bit & 32bit v0.1.5 alpha](https://github.com/vertongen/withings-gpx/releases/download/v0.1.5-alpha/Withings.gpx.export.Setup.0.1.5.exe)

## To Use

To clone and run this repository you’ll need [Git](https://git-scm.com/), [Node.js](https://nodejs.org/en/download/) and [Yarn](https://yarnpkg.com/lang/en/) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/vertongen/withings-gpx.git
# Go into the repository
cd withings-gpx
# Install dependencies
yarn install
# Run the app
yarn start
```
## Troubleshooting

1. `Uncaught error: Module did not self-register`

This is caused by the keytar module, run the command 

`yarn rebuild` 

to build the keytar module on your platform.


2. `no suitable image found`

This is also caused by the keytar module after a dist has been made. 

- Remove the node_modules folder
- Execute `yarn install`
- Execute `yarn rebuild`

## License

[CC0 1.0 (Public Domain)](license.md)
