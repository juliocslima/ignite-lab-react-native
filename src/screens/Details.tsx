import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Box, VStack, Text, HStack, useTheme, ScrollView } from 'native-base';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Alert } from 'react-native';
import { CircleWavyCheck, Hourglass, DesktopTower, ClipboardText } from 'phosphor-react-native';

import { Header } from '../components/Header';
import { OrderProps } from '../components/Order';
import { Loading } from '../components/Loading';
import { Input } from '../components/Input';
import { CardDetails } from '../components/CardDetails';

import { OrderFirestoreDTO } from '../dto/OrderFirestoreDTO';
import { dateformat } from '../utils/FirestoreDateFormat';
import { Button } from '../components/Button';

type RouteParams = {
  orderId: string;
}

type OrderDetais = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const [isLoading, setIsLoading] = useState(true);
  const [solution, setSolution] = useState('');
  const [order, setOrder] = useState<OrderDetais>({} as OrderDetais);

  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { orderId } = route.params as RouteParams;

  function handleCloseOrder() {
    if(!solution) {
      return Alert.alert('Solicitação', 'Informe solução para encerrar a solicitação.')
    }

    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .update({ 
        status: 'closed',
        solution,
        closed_at: firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        Alert.alert('Solicitação', 'Solicitação encerrada com sucesso.');
        navigation.goBack();
      })
      .catch((error) => {
        console.log(error);
        Alert.alert('Solicitação', 'Erro ao encerrar solicitação.');
      })
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then((doc) => {
        const { patrimony, description, status, created_at, closed_at, solution } = doc.data();

        const closed = closed_at ? dateformat(closed_at) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateformat(created_at),
          closed
        });

        setIsLoading(false);
      });
  }, []);

  if(isLoading) {
    return <Loading />;
  }

  return (
    <VStack flex={1} bg="gray.700">
      <Box px={6} bg="gray.600">
        <Header title="Solicitação" />
      </Box>
      
      <HStack bg="gray.500" justifyContent="center" p={4}>
        { 
          order.status === 'closed' 
            ? <CircleWavyCheck size={22} color={colors.green[300]} />
            : <Hourglass size={22} color={colors.secondary[700]} />
        }

        <Text 
          fontSize="sm"
          color={order.status === 'closed' ? colors.green[300] : colors.secondary[700]}
          ml={2}
          textTransform="uppercase"
        >
          { order.status === 'closed' ? 'finalizado' : 'em andamento' }
        </Text>
      </HStack>

      <ScrollView mx={5} showsVerticalScrollIndicator={false}>
        <CardDetails 
          title="equipamento"
          description={ `Patrimônio ${order.patrimony}` }
          icon={DesktopTower}
        />

        <CardDetails 
          title="descrição do problema"
          description={ order.description }
          icon={ClipboardText}
          footer={`Registrado em ${order.when}`}
        />

        <CardDetails 
          title="solução"
          description={ order.solution }
          icon={CircleWavyCheck}
          footer={order.closed && `Encerrado em ${order.closed}`}
        >
          { 
            order.status === 'open' &&  
            <Input 
              placeholder="Descrição da solução"
              onChangeText={setSolution}
              textAlignVertical="top"
              multiline
              h={24}
            />
          }
        </CardDetails>
      </ScrollView>

      { 
        order.status === 'open' && 
          <Button 
            title="Encerrar solicitação"
            m={5}
            onPress={handleCloseOrder}
          />
      }
    </VStack>
  );
}