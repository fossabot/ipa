import KeyValueStore from "orbit-db-kvstore";
import { ImportCandidate } from "ipfs-core-types/src/utils";

import ClientConstellation from "@/client";
import { schémaFonctionSuivi, schémaFonctionOublier } from "@/utils";

export const MAX_TAILLE_IMAGE = 500 * 1000; // 500 kilooctets
export const MAX_TAILLE_IMAGE_VIS = 1500 * 1000; // 1,5 megaoctets

export type typeÉlémentsBdCompte = string;

export default class Compte {
  client: ClientConstellation;
  idBd: string;

  constructor(client: ClientConstellation, id: string) {
    this.client = client;
    this.idBd = id;
  }

  async suivreCourriel(
    f: schémaFonctionSuivi<string | null>,
    idBdCompte?: string
  ): Promise<schémaFonctionOublier> {
    idBdCompte = idBdCompte || this.idBd;
    return await this.client.suivreBd(
      idBdCompte,
      async (bd: KeyValueStore<typeÉlémentsBdCompte>) => {
        const courriel = bd.get("courriel");
        f(courriel || null);
      }
    );
  }

  async sauvegarderCourriel(courriel: string): Promise<void> {
    const { bd, fOublier } = await this.client.ouvrirBd<
      KeyValueStore<typeÉlémentsBdCompte>
    >(this.idBd);
    await bd.set("courriel", courriel);
    fOublier();
  }

  async effacerCourriel(): Promise<void> {
    const { bd, fOublier } = await this.client.ouvrirBd<
      KeyValueStore<typeÉlémentsBdCompte>
    >(this.idBd);
    await bd.del("courriel");
    fOublier();
  }

  async suivreNoms(
    f: schémaFonctionSuivi<{ [key: string]: string }>,
    idBdCompte?: string
  ): Promise<schémaFonctionOublier> {
    idBdCompte = idBdCompte || this.idBd;
    return await this.client.suivreBdDicDeClef<string>(idBdCompte, "noms", f);
  }

  async sauvegarderNom(langue: string, nom: string): Promise<void> {
    const idBdNoms = await this.client.obtIdBd("noms", this.idBd, "kvstore");
    if (!idBdNoms) {
      throw `Permission de modification refusée pour BD ${this.idBd}.`;
    }

    const { bd, fOublier } = await this.client.ouvrirBd<KeyValueStore<string>>(
      idBdNoms
    );
    await bd.set(langue, nom);
    fOublier();
  }

  async effacerNom(langue: string): Promise<void> {
    const idBdNoms = await this.client.obtIdBd("noms", this.idBd);
    if (!idBdNoms) {
      throw `Permission de modification refusée pour BD ${this.idBd}.`;
    }

    const { bd, fOublier } = await this.client.ouvrirBd<KeyValueStore<string>>(
      idBdNoms
    );
    await bd.del(langue);
    fOublier();
  }

  async sauvegarderImage(image: ImportCandidate): Promise<void> {
    let contenu: ImportCandidate;

    if ((image as File).size !== undefined) {
      if ((image as File).size > MAX_TAILLE_IMAGE) {
        throw new Error("Taille maximale excédée");
      }
      contenu = await (image as File).arrayBuffer();
    } else {
      contenu = image;
    }
    const idImage = await this.client.ajouterÀSFIP(contenu);
    const { bd, fOublier } = await this.client.ouvrirBd<
      KeyValueStore<typeÉlémentsBdCompte>
    >(this.idBd);
    await bd.set("image", idImage);
    fOublier();
  }

  async effacerImage(): Promise<void> {
    const { bd, fOublier } = await this.client.ouvrirBd<
      KeyValueStore<typeÉlémentsBdCompte>
    >(this.idBd);
    await bd.del("image");
    fOublier();
  }

  async suivreImage(
    f: schémaFonctionSuivi<Uint8Array | null>,
    idBdCompte?: string
  ): Promise<schémaFonctionOublier> {
    idBdCompte = idBdCompte || this.idBd;
    return await this.client.suivreBd(
      idBdCompte,
      async (bd: KeyValueStore<typeÉlémentsBdCompte>) => {
        const idImage = bd.get("image");
        if (!idImage) return f(null);
        const image = await this.client.obtFichierSFIP(
          idImage,
          MAX_TAILLE_IMAGE_VIS
        );
        return f(image);
      }
    );
  }
}
