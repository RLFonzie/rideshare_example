import React, { useState, useEffect } from "react";
import { Map, Marker, Popup, TileLayer } from "react-leaflet";
import { Socket } from "phoenix";
import { usePosition } from "../util/usePosition";
import Geohash from "latlon-geohash";

const geohashFromPosition = (position) =>
  position ? Geohash.encode(position.lat, position.lng, 5) : "";

export default ({ user }) => {
  const position = usePosition();
  const [channel, setChannel] = useState();

  useEffect(() => {
    const socket = new Socket("/socket", { params: { token: user.token } });
    socket.connect();

    if (!position) {
      return;
    }

    const phxChannel = socket.channel("cell:" + geohashFromPosition(position));
    phxChannel.join().receive("ok", (response) => {
      console.log("Joined channel!");
      setChannel(phxChannel);
    });

    return () => phxChannel.leave();
  }, [geohashFromPosition(position)]);

  if (!position) {
    return <div>Awaiting for position...</div>;
  }

  if (!channel) {
    return <div>Connecting to channel...</div>;
  }

  return (
    <div>
      Logged in as {user.type}
      {user.type == "rider" && (
        <div>
          <button onClick={requestRide}>Request Ride</button>
        </div>
      )}
      <Map center={position} zoom={15}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position} />
      </Map>
    </div>
  );
};
