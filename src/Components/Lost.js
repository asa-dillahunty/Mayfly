// Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

function Lost() {

  return (
    <div>
      <h1>You are lost</h1>
      <Link to="/">Return Home</Link>
      {/* Display the user's current hours here */}
    </div>
  );
}

export default Lost;
