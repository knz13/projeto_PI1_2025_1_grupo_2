
import dotenv from 'dotenv';

var initializedEnvironment = false;

export const Environment = {
    get_backend_url: () => {
        return process.env.BACKEND_URL || "http://localhost:5875";
    },
    init: () => {
        if (initializedEnvironment) return;
        dotenv.config();
        initializedEnvironment = true;
    }
}