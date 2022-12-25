import { Node } from "reactflow";

export const isNodeNested = (
  nodes: Node[],
  node: Node,
  comparableNode: Node
): boolean => {
  if (node.id === comparableNode.id) {
    return true;
  }
  if (!node.parentNode) {
    return false;
  }
  const parent = nodes.find((n) => n.id === node.parentNode);
  return isNodeNested(nodes, parent!, comparableNode);
};
