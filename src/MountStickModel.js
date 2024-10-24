import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as XLSX from 'xlsx';
import { Cylinder, OrbitControls, Box } from '@react-three/drei';
import * as THREE from 'three';
import './MountStickModel.css'

// Component to load Excel and display the 3D pipe model with supports
const MountStickModel = () => {
  const [members, setMembers] = useState([]); // To store start/end node pairs from sheet A
  const [nodes, setNodes] = useState([]);     // To store coordinates from sheet B
  const [supports, setSupports] = useState([]); // To store support types from sheet C

  useEffect(() => {
    const loadData = async () => {
      // Fetch the Excel file from the public folder
      const response = await fetch('/Sample.xlsx'); // Adjust the path as per your setup
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Extracting the data from Sheet A (members: start/end nodes)
      const memberSheet = workbook.Sheets['A'];  // Sheet A
      const memberData = XLSX.utils.sheet_to_json(memberSheet, { header: 1 });

      // Extracting the XYZ node data from Sheet B (coordinates)
      const nodeSheet = workbook.Sheets['B'];  // Sheet B
      const nodeData = XLSX.utils.sheet_to_json(nodeSheet, { header: 1 });

      // Extracting the support types from Sheet C
      const supportSheet = workbook.Sheets['C'];  // Sheet C
      const supportData = XLSX.utils.sheet_to_json(supportSheet, { header: 1 });

      // Parse node data from Sheet B (Coordinates)
      const nodeCoordinates = nodeData.slice(1).map((row) => ({
        id: row[0],  // Node number
        x: parseFloat(row[1]),  // X coordinate
        y: parseFloat(row[2]),  // Y coordinate
        z: parseFloat(row[3])   // Z coordinate
      }));

      // Parse members (start and end node connections) from Sheet A
      const parsedMembers = memberData.slice(1).map((row) => ({
        start: row[1],  // Start Node
        end: row[2]     // End Node
      }));

      // Parse support types from Sheet C
      const parsedSupports = supportData.slice(1).map((row) => ({
        nodeId: row[0],       // Node ID
        supportType: row[1]   // Support Type (e.g., FIXED)
      }));

      setMembers(parsedMembers);
      setNodes(nodeCoordinates);
      setSupports(parsedSupports);
    };

    loadData();
  }, []);

  // Helper to find node by its ID
  const findNodeById = (id) => nodes.find(node => node.id === id);

  // Helper to find support type by node ID
  const findSupportByNodeId = (id) => supports.find(support => support.nodeId === id);

  // Helper function to calculate rotation based on direction
  const calculateRotation = (startNode, endNode) => {
    const direction = new THREE.Vector3(
      endNode.x - startNode.x,
      endNode.y - startNode.y,
      endNode.z - startNode.z
    );

    const axis = new THREE.Vector3(0, 1, 0); // Default up direction
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis.normalize(), direction.normalize());

    return new THREE.Euler().setFromQuaternion(quaternion);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
    <Canvas camera={{ position: [100, 100, 100], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />

      {/* Draw pipes (cylinders) between nodes */}
      {members.map((member, index) => {
        const startNode = findNodeById(member.start);
        const endNode = findNodeById(member.end);

        if (startNode && endNode) {
          // Calculate the midpoint between start and end
          const midX = (startNode.x + endNode.x) / 2;
          const midY = (startNode.y + endNode.y) / 2;
          const midZ = (startNode.z + endNode.z) / 2;

          // Calculate length and orientation of the cylinder
          const distance = Math.sqrt(
            Math.pow(endNode.x - startNode.x, 2) +
            Math.pow(endNode.y - startNode.y, 2) +
            Math.pow(endNode.z - startNode.z, 2)
          );

          // Calculate rotation for the cylinder (aligning with direction)
          const rotation = calculateRotation(startNode, endNode);

          return (
            <Cylinder
              key={index}
              args={[0.5, 0.5, distance, 32]} // Pipe's radius and length
              position={[midX, midY, midZ]}
              rotation={rotation.toArray()} // Use rotation calculated
              >
              <meshStandardMaterial attach="material" color="yellow" /> {/* Set the material color */}
            </Cylinder>
          );
        }

        return null;
      })}

      {/* Draw supports at fixed nodes */}
      {supports.map((support, index) => {
        const supportNode = findNodeById(support.nodeId);

        if (supportNode) {
          return (
            <Box
              key={index}
              args={[2, 2, 2]} // Support size
              position={[supportNode.x, supportNode.y, supportNode.z]}
              color="red" // Color to indicate support
            />
          );
        }

        return null;
      })}
    </Canvas>
    </div>
  );
};

export default MountStickModel;
