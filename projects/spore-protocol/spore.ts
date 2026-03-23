import { createSpore, predefinedSporeConfigs } from "@spore-sdk/core";
import { config as lumosConfig, hd, helpers, RPC } from "@ckb-lumos/lumos";
import { common } from "@ckb-lumos/common-scripts";

const PRIVATE_KEY = "0x90413b43bbfc86daeec9370e81e77bab" +
  "551a01458058916041237710ffa42d95";
const SPORE_CONFIG = predefinedSporeConfigs.Aggron4;
const CLUSTER_ID =
  "0x37b8b772852d45ed16f8a7a2cd0718c983eda34c0bf40963939f95694f624596";

lumosConfig.initializeConfig(lumosConfig.predefined.AGGRON4);

const blake160 = hd.key.privateKeyToBlake160(PRIVATE_KEY);
const SCRIPTS = lumosConfig.predefined.AGGRON4.SCRIPTS;
const lock = {
  codeHash: SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
  hashType: SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
  args: blake160,
};
const address = helpers.encodeToAddress(lock);
const rpc = new RPC(SPORE_CONFIG.ckbNodeUrl);

async function signAndSend(txSkeleton: any): Promise<string> {
  const cfg = { config: lumosConfig.predefined.AGGRON4 };
  const prepared = common.prepareSigningEntries(txSkeleton, cfg);
  const sign = (e: any) => hd.key.signRecoverable(e.message, PRIVATE_KEY);
  const sigs = prepared.get("signingEntries").map(sign).toArray();
  const signed = helpers.sealTransaction(prepared, sigs);
  return rpc.sendTransaction(signed, "passthrough");
}

async function main() {
  console.log("Address:", address);
  console.log("Minting spore into cluster:", CLUSTER_ID);

  const content = Buffer.from("My first on-chain NFT. - David");
  const sporeResult = await createSpore({
    data: {
      contentType: "text/plain",
      content,
      clusterId: CLUSTER_ID,
    },
    fromInfos: [address],
    toLock: lock,
    config: SPORE_CONFIG,
  });

  const { txSkeleton: sporeTx, outputIndex: sIdx } = sporeResult;
  const sporeId = sporeTx.get("outputs").get(sIdx).cellOutput.type.args;
  console.log("Spore ID:", sporeId);

  const base = "https://testnet.explorer.nervos.org/transaction/";
  const sporeHash = await signAndSend(sporeTx);
  console.log("Spore tx:", sporeHash);
  console.log("Explorer:", base + sporeHash);
}

main().catch(console.error);
