import { createController, ControllerOptions, Controller } from "ipfsd-ctl";

const FACTEUR = 1;

export const config = {
  patience: 10 * 1000 * FACTEUR,
  patienceInit: 60 * 1000 * FACTEUR,
};

export const initierSFIP = async (dossier = ""): Promise<Controller> => {
  const controllerConfig: ControllerOptions = {
    type: "proc",
    test: true,
    disposable: true,
    ipfsModule: await import("ipfs"),
    ipfsOptions: {
      repo: dossier,
    },
  };

  // Spawn an IPFS daemon (type defined in)
  const ipfsd = createController(controllerConfig);
  return ipfsd;
};

export const arrêterSFIP = async (ipfsd: Controller) => {
  await ipfsd.stop();
};
