import React, { useState } from 'react';
import {
  Box,
  Button,
  Textarea,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Flex,
  Heading,
  Text,
  useToast,
  Divider,
  HStack,
  IconButton,
  Tooltip
} from '@chakra-ui/react';

const ScriptEditor = ({ script, onSave, onCancel, onAiModify }) => {
  const [editedScript, setEditedScript] = useState(script || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiModifying, setIsAiModifying] = useState(false);
  const toast = useToast();
  
  // Fonction pour gérer les modifications manuelles
  const handleManualSave = () => {
    if (!editedScript.trim()) {
      toast({
        title: "Erreur",
        description: "Le script ne peut pas être vide",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    onSave(editedScript);
  };
  
  // Fonction pour demander une modification par l'IA
  const handleAiModify = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Instruction manquante",
        description: "Veuillez indiquer ce que l'IA doit modifier",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsAiModifying(true);
    
    try {
      await onAiModify(aiPrompt, editedScript);
      setAiPrompt(''); // Réinitialiser le champ après une demande réussie
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre demande. Veuillez réessayer.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAiModifying(false);
    }
  };
  
  return (
    <Box p={5} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white" width="100%">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center" color="blue.700">
          Édition du Script
        </Heading>
        
        <Divider />
        
        {/* Section de modification manuelle */}
        <Box>
          <Heading size="md" mb={4} color="blue.600">
            Édition manuelle
          </Heading>
          <FormControl>
            <FormLabel fontWeight="bold">Contenu du script</FormLabel>
            <Textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              placeholder="Modifiez le script ici..."
              minHeight="300px"
              size="md"
              fontSize="sm"
              fontFamily="mono"
            />
          </FormControl>
          
          <Flex justify="flex-end" mt={4}>
            <Button 
              colorScheme="gray" 
              mr={3} 
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleManualSave}
              isLoading={isSubmitting}
            >
              Sauvegarder
            </Button>
          </Flex>
        </Box>
        
        <Divider my={4} />
        
        {/* Section de modification par IA */}
        <Box>
          <Heading size="md" mb={4} color="purple.600">
            Modifier avec l'IA
          </Heading>
          <Text mb={4} fontSize="sm" color="gray.600">
            Décrivez les modifications souhaitées et l'IA mettra à jour le script en fonction de vos instructions.
          </Text>
          
          <FormControl>
            <FormLabel fontWeight="bold">Instructions pour l'IA</FormLabel>
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Ajoute plus de statistiques sur le sujet, Simplifie l'introduction, Rends le plus engageant..."
              size="md"
            />
          </FormControl>
          
          <HStack spacing={2} mt={4}>
            <Button
              colorScheme="purple"
              onClick={handleAiModify}
              isLoading={isAiModifying}
              loadingText="En cours de traitement..."
              width="full"
              leftIcon={<span>🤖</span>}
            >
              Modifier avec l'IA
            </Button>
          </HStack>
          
          <Box mt={4} p={3} bg="gray.50" borderRadius="md">
            <Text fontSize="xs" color="gray.500">
              <strong>Suggestions:</strong> "Ajoute des exemples concrets", "Améliore la conclusion", 
              "Rends le ton plus conversationnel", "Ajoute des questions rhétoriques", "Inclus plus de statistiques récentes"
            </Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default ScriptEditor;
