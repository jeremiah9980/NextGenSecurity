const { RingApi } = require('ring-client-api');
const fs = require('fs');
require('dotenv').config();

const ringApi = new RingApi({
  refreshToken: process.env.RING_REFRESH_TOKEN,
  debug: true,
});

(async () => {
  const locations = await ringApi.getLocations();

  for (const location of locations) {
    const cameras = await location.cameras;

    for (const camera of cameras) {
      console.log(`Connected to: ${camera.name}`);
      
      camera.onNewNotification.subscribe((notification) => {
        console.log('New Ring Event:', notification);
      });

      // Optional snapshot
      const snapshot = await camera.getSnapshot();
      fs.writeFileSync(`snapshot-${camera.name}.jpg`, snapshot);
      console.log(`Snapshot saved for ${camera.name}`);
    }
  }
})();

