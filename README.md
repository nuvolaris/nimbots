# Sky Battle

Welcome to Sky Battle, a programming game based on [Nuvolaris](https://www.nuvolaris.io).

You play Sky Battle just coding your robot as a serverless action.

Your robot can then fight against other robots.

![Sky Battle](/web/public/api/v1/web/nuvolaris/default/skybattle/img/splash.png)

# How to install Sky Battle

First, install Nuvolaris from [get.nuvolaris.io](https://get.nuvolaris.io).

You can install it basically everywhere, locally, in a Virtual Machine or in a Kubernetes cluster.

If you have Docker on your local machine, the simplest way is [download the installer](https://www.nuvolaris.io/Download) and use the command:

```
nuv setup --devcluster
```

Once Nuvolaris is installed, you can download the SkyBattle action (it is the file `skybattle.zip`) from [here](https://github.com/nuvolaris/skybattle/releases) and run:

```
nuv wsk action update skybattle skybattle.zip --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t
```

Change the password `s3cr3t` to your favorite.

Then get the url with: 

```
nuv wsk action get skybattle --url
```

open the browser in the url and start playing.

# How to code your robot

You can code your fighter in any programming language supported by Nuvolaris. 

How to control your fighter [is described here](API.md).

You can also check [those examples](web/public/api/v1/web/nuvolaris/default/skybattle/samples) for inspiration.
