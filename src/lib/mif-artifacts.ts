/** Mock of the Maximo Integration Framework (MIF) API — real artifact-name
 * lookups per artifact type would come from OSLC/REST endpoints against the
 * connected environment; this simulates that round trip (latency included)
 * so the async Combobox + Skeleton have something real to wait on. Keyed by
 * the MIF artifact type each extract-mif-* task pins through its
 * `scopeConstant` in mds-data.ts. */
const ARTIFACT_NAMES_BY_TYPE: Record<string, string[]> = {
  "1": ["MXAPIWO", "MXAPIASSET", "MXAPIPERSON", "MXAPIPO", "MXAPIINVENTORY", "MXAPISR"], // Estrutura de Objeto
  "2": ["WORKORDER_EP", "ASSET_EP", "PERSON_EP", "INVENTORY_EP"], // End Point
  "3": ["MXWOWebService", "MXAssetWebService", "MXPersonWebService"], // Web Service
  "4": ["WORKORDER", "ASSET", "PERSON", "PURCHASEORDER"], // Enterprise Service
  "5": ["SAP_S4HANA", "ORACLE_NETSUITE", "TOTVS_ERP"], // Sistema Externo
  "6": ["WorkOrderStatusPC", "AssetStatusPC", "PersonExtGL"], // Canal de Publicação
  "8": ["WorkOrderIC", "AssetIC", "InventoryIC"], // Canal de Invocação
  "9": ["oslc.Asset", "oslc.WorkOrder", "oslc.Person"], // Recursos OSLC
  "10": ["json.Asset", "json.WorkOrder", "json.ServiceRequest"], // Recursos JSON
};

export function fetchArtifactNames(artifactType: string): Promise<string[]> {
  const names = ARTIFACT_NAMES_BY_TYPE[artifactType] || [];
  return new Promise((resolve) => {
    setTimeout(() => resolve(names), 550 + Math.random() * 300);
  });
}
