# Stage

The server now reads simulation parameters from `apps/server/config/parameters.json` and exposes them to clients.

ECS systems consume these shared values instead of hard-coded constants, keeping server and client calculations in sync.

The client highlights the right-clicked map tile and commands the snail to move to that square, stopping once it arrives.
