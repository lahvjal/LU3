"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          SERVICE_WORKER_PATH,
          {
            scope: "/",
          },
        );

        void registration.update();
      } catch (error) {
        console.error("Failed to register service worker", error);
      }
    };

    window.addEventListener("load", registerServiceWorker);

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}
