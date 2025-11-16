import React from "react";

export default function Logo({ size = 48 }) {
  return (
    <img
      src="https://pbs.twimg.com/profile_images/1970206496051838976/lZkW7Buv_400x400.jpg"
      alt="Logo"
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ borderRadius: 12 }}
    />
  );
}
