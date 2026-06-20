import cluster from "node:cluster";
import http from "node:http";
import { availableParallelism } from "node:os";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";
import { setupMaster, setupWorker } from "@socket.io/sticky";
import { env } from "./config/env";
import { createHttpServer } from "./create-http-server";

const resolveWorkerCount = () => {
  if (env.clusterWorkers > 0) {
    return env.clusterWorkers;
  }

  return Math.max(1, availableParallelism());
};

const startSingle = async () => {
  const { httpServer } = await createHttpServer();

  httpServer.listen(env.port, () => {
    console.log(`[server] http://localhost:${env.port}`);
  });
};

const startClustered = async () => {
  if (cluster.isPrimary) {
    const loadBalancer = http.createServer();

    setupMaster(loadBalancer, {
      loadBalancingMethod: "least-connection"
    });

    setupPrimary();
    cluster.setupPrimary({
      serialization: "advanced"
    });

    loadBalancer.listen(env.port, () => {
      console.log(`[cluster] ${resolveWorkerCount()} workers na porta ${env.port}`);
    });

    for (let workerIndex = 0; workerIndex < resolveWorkerCount(); workerIndex += 1) {
      cluster.fork();
    }

    cluster.on("exit", () => {
      cluster.fork();
    });

    return;
  }

  const { io } = await createHttpServer();
  io.adapter(createAdapter());
  setupWorker(io);
};

const bootstrap = async () => {
  if (env.clusterEnabled && env.nodeEnv !== "development") {
    await startClustered();
    return;
  }

  await startSingle();
};

void bootstrap();
