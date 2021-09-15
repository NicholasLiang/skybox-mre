# SkyboxMRE App

SkyboxMRE is an MRE app that host a NodeJS server using Mixed Reality Extension(MRE) package to render high quality, seamless 360 image in Altspace VR, a social VR platform, which is developed on Unity Game Engine.

Notes: SkyboxMRE used a GlTF-based Skybox so this app won't be affected the upcoming URP render tools update for Altspace.

# How to put the MRE app in Altspace VR?

MRE Sample Link:
```
wss://mres.altvr.com/skybox
```

# Parameters

SkyboxMRE provide three parameters for you to customize your experience. The parameters are not case sensitive. Here is the list:

- url
- scale
- moderator


## URL

Provide a permanent link for the SkyboxMRE so you don't have to set skybox url each time you use it.

Example:
```
wss://mres.altvr.com/skybox?url=https://docs.unity3d.com/uploads/Main/skybox-lat-long-layout.png
```
## Size

Change the size of the skybox for different scenarios

Options:
- **small** : private viewing section
- **medium** : small group
- **large** : replace the skybox
- or any given number in decimal

Example:
```
wss://mres.altvr.com/skybox?scale=small
```
## Moderator?

A boolean value to set if only the moderator can change the URL in realtime

Options:
- **false** or **off** : everyone can use the button and change the URL of the skybox. Great for a 360 image sharing section
- **true** or **on** : only the host can change the URL of the skybox.


Example:
```
wss://mres.altvr.com/skybox?moderator=false
wss://mres.altvr.com/skybox?moderator=on
```

## Content Pack

1. Format parameters in json format (refer to the json template)
1. host on https://account.altvr.com/content_packs
1. get the content pack id from the url
1. create an MRE with the content pack parameter set as the id

Example:
```
wss://mres.altvr.com/skybox?content_pack=1824573042232132050
```

Content Pack template:
```json
{
  "url": "YourImageURLHere",
  "scale": "a number, small, medium or large",
  "moderator": "true, on, false, off"
}
```

## Combined?
Example:
```
wss://mres.altvr.com/skybox?url=https://docs.unity3d.com/uploads/Main/skybox-lat-long-layout.png&scale=small&moderator=false
```

## Credit

Developed by Nicholas Liang

[![GitHub](https://i.stack.imgur.com/tskMh.png) GitHub](https://github.com/NicholasLiang)
&nbsp;
[![Linkedin](https://i.stack.imgur.com/gVE0j.png) LinkedIn](https://www.linkedin.com/in/nicholas-liang-20a44414b/)
&nbsp;
[![Twitter URL](https://img.shields.io/twitter/url/https/twitter.com/_nickliang.svg?style=social&label=Follow%20%40_nickliang_)](https://twitter.com/_nickliang)