import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [products, setProducts] = useState<Product[]>();
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });



  const addProduct = async (productId: number) => {
    try {

      let response = await api.get(`/stock/${productId}`)
      const stock = response.data

      response = await api.get(`/products/${productId}`)
      const product = response.data

      const existInCart = cart.find(product => product.id === productId);

      if (existInCart) {
        updateProductAmount({
          productId,
          amount: existInCart.amount + 1
        });
      }

      if (!existInCart) {

        if (stock.amount < 1) {
          toast.error('Não há mais produtos disponíveis.')
        }

        const newCart = [
          ...cart,
          { ...product, amount: 1 },
        ];

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        setCart(() => {
          const newStoragedCart = localStorage.getItem('@RocketShoes:cart')

          if (newStoragedCart) {
            return JSON.parse(newStoragedCart);
          }
        });

        toast.success('Produto adicionado ao carrinho.')
      } else {
        toast.error('Produto não existe.')
      }

    } catch {
      toast.error('Ocorreu um erro ao adicionar o produto ao carrinho.')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const filteredCart = cart.filter(product => product.id !== productId);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart));

      setCart(() => {
        const newStoragedCart = localStorage.getItem('@RocketShoes:cart')

        if (newStoragedCart) {
          return JSON.parse(newStoragedCart);
        }
      });

      toast.success('Produto removido');
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let response = await api.get(`/stock/${productId}`)
      const stock = response.data

      response = await api.get(`/products/${productId}`)
      const product = response.data

      const isIncrementingAmount = product && amount > product.amount

      console.log({
        stockAmount: stock.amount,
        queriedAmount: amount
      })

      if (!product) {
        throw new Error
      }

      if (stock.amount >= amount && amount > 1) {
        // atualizando carrinho com mais um produto
        const updatedCart = cart.map(product => {
          return product.id === productId
            ? { ...product, amount: amount }
            : product;
        });

        // atualizando cart
        setCart(updatedCart);

        // atualizando carrinho no LOCAL STORAGE com mais um produto
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

        let message = 'Produto adicionado ao carrinho.'
        isIncrementingAmount
          ? message = message
          : message = 'Produto removido do carrinho.'
      } else {
        toast.error('Impossível atualizar o carrinho para esse valor.')
      }

    } catch {
      toast.error('Erro na alteração do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
