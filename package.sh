TAG="${1:?version}"
VER="${TAG#refs/*/}"
PRE="https://github.com/nuvolaris/nuvolaris-cli/releases/download"
#wget -nc $PRE/$VER/nuv-$VER-windows-amd64.zip.md5
for OS in linux darwin
do for ARC in amd64 arm64
   do wget -nc $PRE/$VER/nuv-$VER-$OS-$ARC.tar.gz
      pushd skybattle-robots
      rm -f nuv nuv.exe
      tar xzvf ../nuv-$VER-$OS-$ARC.tar.gz
      mv LICENSE LICENSE.nuv
      cp ../LICENSE.md LICENSE.skybattle
      tar czvf ../skybattle-$VER-$OS-$ARC.tar.gz *
      popd
   done
done
wget -nc $PRE/$VER/nuv-$VER-windows-amd64.zip
pushd skybattle-robots
rm -f nuv nuv.exe
unzip ../nuv-$VER-windows-amd64.zip
mv LICENSE LICENSE.nuv
cp ../LICENSE.md LICENSE.skybattle
zip -r ../skybattle-$VER-windows-amd64.zip *
