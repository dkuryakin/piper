import { Node } from "reactflow";

export const getParentNodeIds = (
  nodes: Node[],
  node: Node,
  endNode?: Node
): string[] => {
  if (node.id === endNode?.id) {
    return [];
  }
  const result: string[] = [];
  const parent = nodes.find((n) => n.id === node?.parentNode);
  if (node.parentNode) {
    result.push(node.parentNode);
  }
  if (parent?.parentNode) {
    result.push(...getParentNodeIds(nodes, parent));
  }
  return result;
};
