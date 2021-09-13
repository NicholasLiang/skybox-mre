# Skybox MRE App

Skybox-mre is an MRE app that host a NodeJS server using Mixed Reality Extension(MRE) package to render high quality, seamless 360 image in Altspace VR, a social VR platform, which is developed on Unity Game Engine.

# How to put the MRE app in Altspace VR?

MRE Sample Link:
```
wss://skybox-mre.azurewebsites.net
```

# Parameters
## URL

Provide a permanent link for the Skybox MRE so you don't have to set skybox url everytime

Example:
```
wss://skybox-mre.azurewebsites.net?url=https://docs.unity3d.com/uploads/Main/skybox-lat-long-layout.png
```
## Size

Change the size of the skybox for different scenarios

### Options:
- **small** : private viewing section
- **median** : small group
- **large** : replace the skybox
- or any given number in decimal

Example:
```
wss://skybox-mre.azurewebsites.net?scale=small
```
## Moderater only?

A boolean value to set if only the moderater can change the URL in realtime

Example:
```
wss://skybox-mre.azurewebsites.net?moderater_only=false
```

## Content Pack

1. Format parameters in json format (refer to the json template)
1. host on https://account.altvr.com/content_packs
1. get the content pack id from the url
1. create an MRE with the content pack parameter set as the id

Example:
```
wss://skybox-mre.azurewebsites.net?content_pack=1824573042232132050
```

Content Pack template:
```json
{
  "url": Your image URL here,
  "scale": a number, "small", "median" or "large",
  "moderator_only": true or false
}
```

## Combined?
Example:
```
wss://skybox-mre.azurewebsites.net?url=https://docs.unity3d.com/uploads/Main/skybox-lat-long-layout.png&scale=small&moderater_only=false
```

