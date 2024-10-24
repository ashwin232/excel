import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as XLSX from 'xlsx';
import { Cylinder, OrbitControls, Box } from '@react-three/drei';
import './MountStickModel.css'


const MountStickModel = () => {
  const [members, setMembers] = useState([]); 
  const [nodes, setNodes] = useState([]);     
  const [supports, setSupports] = useState([]); 

  useEffect(() => {
    const loadData = async () => {
      try {
        
        const response = await fetch('/Sample.xlsx'); 

       
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
          const text = await response.text();
          console.error("Received HTML instead of Excel file:", text);
          return; 
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        
        const memberSheet = workbook.Sheets['A'];  // Sheet A
        const memberData = XLSX.utils.sheet_to_json(memberSheet, { header: 1 });

       
        const nodeSheet = workbook.Sheets['B'];  // Sheet B
        const nodeData = XLSX.utils.sheet_to_json(nodeSheet, { header: 1 });

       
        const supportSheet = workbook.Sheets['C'];  // Sheet C
        const supportData = XLSX.utils.sheet_to_json(supportSheet, { header: 1 });

       
        const nodeCoordinates = nodeData.slice(1).map((row) => ({
          id: row[0],  // Node number
          x: parseFloat(row[1]),  
          y: parseFloat(row[2]),  
          z: parseFloat(row[3])   
        }));

        
        const parsedMembers = memberData.slice(1).map((row) => ({
          start: row[1], 
          end: row[2]     
        }));

                const parsedSupports = supportData.slice(1).map((row) => ({
          nodeId: row[0],       
          supportType: row[1]   
        }));

        
        setMembers(parsedMembers);
        setNodes(nodeCoordinates);
        setSupports(parsedSupports);
      } catch (error) {
        console.error("Error loading Excel file:", error);
      }
    };

    loadData();
  }, []);

  // Helper to find node by its ID
  const findNodeById = (id) => nodes.find(node => node.id === id);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',backgroundColor:'black' }}>
      <Canvas camera={{ position: [100, 100, 100], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />

        
        {members.map((member, index) => {
          const startNode = findNodeById(member.start);
          const endNode = findNodeById(member.end);

          if (startNode && endNode) {
            const midX = (startNode.x + endNode.x) / 2;
            const midY = (startNode.y + endNode.y) / 2;
            const midZ = (startNode.z + endNode.z) / 2;

            
            const distance = Math.sqrt(
              Math.pow(endNode.x - startNode.x, 2) +
              Math.pow(endNode.y - startNode.y, 2) +
              Math.pow(endNode.z - startNode.z, 2)
            );

            
            const direction = [
              endNode.x - startNode.x,
              endNode.y - startNode.y,
              endNode.z - startNode.z
            ];

           
            return (
              <Cylinder
                key={index}
                args={[0.5, 0.5, distance, 32]} 
                position={[midX, midY, midZ]}
                rotation={[Math.atan2(direction[1], direction[2]), 0, Math.atan2(direction[0], direction[2])]}
                > 
                <meshStandardMaterial attach="material" color="yellow" />
              </Cylinder>
            );
          }

          return null;
        })}

      
        {supports.map((support, index) => {
          const supportNode = findNodeById(support.nodeId);

          if (supportNode) {
            return (
              <Box
                key={index}
                args={[2, 2, 2]} 
                position={[supportNode.x, supportNode.y, supportNode.z]}
                color="red" 
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