import { createCluster, createSpore, predefinedSporeConfigs } from "@spore-sdk/core";
import { config as lumosConfig, hd, helpers, RPC } from "@ckb-lumos/lumos";
import { common } from "@ckb-lumos/common-scripts";

const PRIVATE_KEY = "0x90413b43bbfc86daeec9370e81e77bab" +
  "551a01458058916041237710ffa42d95";
const SPORE_CONFIG = predefinedSporeConfigs.Aggron4;

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

  console.log("\nCreating cluster...");
  const clusterResult = await createCluster({
    data: {
      name: "David Collection",
      description: "On-chain NFT collection - CKB testnet",
    },
    fromInfos: [address],
    toLock: lock,
    config: SPORE_CONFIG,
  });

  const { txSkeleton: clusterTx, outputIndex: cIdx } = clusterResult;
  const clusterId = clusterTx.get("outputs").get(cIdx).cellOutput.type.args;
  console.log("Cluster ID:", clusterId);

  const clusterHash = await signAndSend(clusterTx);
  console.log("Cluster tx:", clusterHash);
  const base = "https://testnet.explorer.nervos.org/transaction/";
  console.log("Explorer:", base + clusterHash);

  console.log("\nWaiting 30s for cluster to confirm...");
  await new Promise((r) => setTimeout(r, 30000));

  console.log("\nMinting spore...");
  const content = Buffer.from("My first on-chain NFT. - David");
  const sporeResult = await createSpore({
    data: {
      contentType: "text/plain",
      content,
      clusterId,
    },
    fromInfos: [address],
    toLock: lock,
    config: SPORE_CONFIG,
  });

  const { txSkeleton: sporeTx, outputIndex: sIdx } = sporeResult;
  const sporeId = sporeTx.get("outputs").get(sIdx).cellOutput.type.args;
  console.log("Spore ID:", sporeId);

  const sporeHash = await signAndSend(sporeTx);
  console.log("Spore tx:", sporeHash);
  console.log("Explorer:", base + sporeHash);
}

main().catch(console.error);
