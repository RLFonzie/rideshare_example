import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Socket, Presence } from "phoenix";
import { usePosition } from "../util/usePosition";
import Geohash from "latlon-geohash";

const geohashFromPosition = (position) =>
  position ? Geohash.encode(position.lat, position.lng, 5) : "";

export default ({ user }) => {
  const position = usePosition();
  const [channel, setChannel] = useState();
  const [rideRequests, setRideRequests] = useState([]);
  const [userChannel, setUserChannel] = useState();
  const [presences, setPresences] = useState({});

  const getLat = (position) => (position ? position.lat : 0);
  const getLng = (position) => (position ? position.lng : 0);

  useEffect(() => {
    const socket = new Socket("/socket", {
      params: { token: user.token, position },
    });
    socket.connect();

    if (!position) {
      return;
    }

    const phxChannel = socket.channel("cell:" + geohashFromPosition(position), {
      position: position,
    });
    phxChannel.join().receive("ok", (response) => {
      console.log("Joined channel!");
      setChannel(phxChannel);
    });

    const phxUserChannel = socket.channel("user:" + user.id);
    phxUserChannel.join().receive("ok", (response) => {
      console.log("Joined user channel");
      setUserChannel(phxUserChannel);
    });

    return () => phxChannel.leave();
  }, [geohashFromPosition(position), position]);

  useEffect(() => {
    if (channel) {
      channel.push("update_position", position);
    }
  }, [getLat(position), getLng(position), position]);

  if (!position) {
    return <div>Awaiting for position...</div>;
  }

  if (!channel || !userChannel) {
    return <div>Connecting to channel...</div>;
  }

  const requestRide = () =>
    channel.push("ride:request", { position: position });

  channel.on("ride:requested", (rideRequest) =>
    setRideRequests(rideRequests.concat([rideRequest]))
  );

  channel.on("presence_state", (state) => {
    let syncedPresences = Presence.syncState(presences, state);
    setPresences(syncedPresences);
  });

  channel.on("presence_diff", (response) => {
    let syncedPresences = Presence.syncDiff(presences, response);
    setPresences(syncedPresences);
  });

  userChannel.on("ride:created", (ride) =>
    console.log("A ride has been created!")
  );

  const positionFromPresences = Presence.list(presences)
    .filter((presence) => !!presence.metas)
    .map((presence) => presence.metas[0]);

  console.log(positionFromPresences);
  console.log(rideRequests);

  let acceptRideRequest = (request_id) =>
    channel.push("ride:accept_request", {
      request_id,
    });

  return (
    <div>
      Logged in as {user.type}
      {user.type == "rider" && (
        <div>
          <button onClick={requestRide}>Request Ride</button>
        </div>
      )}
      <MapContainer
        style={{ height: "450px", width: "100%" }}
        center={position}
        zoom={15}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position} />

        {rideRequests.map(({ request_id, position }) => (
          <Marker key={request_id} position={position}>
            <Popup>
              New ride request
              <button onClick={() => acceptRideRequest(request_id)}>
                Accept
              </button>
            </Popup>
          </Marker>
        ))}
        {positionFromPresences.map(({ lat, lng, phx_ref }) => {
          <Marker key={phx_ref} position={{ lat, lng }} />;
        })}
      </MapContainer>
    </div>
  );
};
