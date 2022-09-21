import React, { useState } from "react";
import Login from "./login";
import Map from "./map";

export default () => {
  const [user, setUser] = useState();

  const handleLogin = (user) => setUser(user);

  return user ? <Map user={user} /> : <Login onLogin={handleLogin} />;
};
